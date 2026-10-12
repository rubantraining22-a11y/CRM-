import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://whatsapp-crm-server-447670879986.asia-south1.run.app'
    : 'http://localhost:5000');

export const useSocket = (onMessageReceived, onLeadUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current.on('connect', () => {
      console.log('⚡ [Socket.io Connected]', socketRef.current.id);
    });

    socketRef.current.on('chat:message_sent', (data) => {
      if (onMessageReceived) onMessageReceived(data);
    });

    socketRef.current.on('whatsapp:incoming', (data) => {
      toast.success(`💬 New WhatsApp message from ${data.from || data.contact?.name || 'Lead'}`);
      if (onMessageReceived) onMessageReceived(data);
    });

    socketRef.current.on('whatsapp:incoming_message', (data) => {
      toast.success(`💬 WhatsApp from ${data.contact?.name || data.contact?.phone || 'Customer'}: ${data.message?.text || ''}`);
      if (onMessageReceived) onMessageReceived(data);
    });

    socketRef.current.on('whatsapp:status_update', (data) => {
      console.log('WhatsApp status update:', data);
    });

    socketRef.current.on('lead:updated', (data) => {
      toast('📌 Lead status updated', { icon: '🔄' });
      if (onLeadUpdate) onLeadUpdate(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};

export default useSocket;
