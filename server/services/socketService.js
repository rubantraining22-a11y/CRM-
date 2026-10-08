let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

// Emit a new inbound WhatsApp message to all connected clients
const emitNewMessage = (message) => {
  if (io) {
    io.emit('new_whatsapp_message', message);
  }
};

// Emit lead stage update
const emitLeadUpdate = (lead) => {
  if (io) {
    io.emit('lead_updated', lead);
  }
};

module.exports = { initSocket, getIO, emitNewMessage, emitLeadUpdate };
