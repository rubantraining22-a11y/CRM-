import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Search, Bot, Zap, CheckCheck, CheckCircle,
  RefreshCw, Phone, MessageSquare, Plus, X, Loader,
  AlertTriangle, FileText, ChevronDown, Sparkles, FileSpreadsheet,
  Paperclip, Image, Video, File, Lock, ShieldCheck, Download
} from 'lucide-react';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import BulkTemplateSenderModal from '../components/BulkTemplateSenderModal';

const REGISTERED_NUMBER = import.meta.env.VITE_WA_REGISTERED_NUMBER || '+919344914311';

// ─────────────────────────────────────────────
// Small helper components
// ─────────────────────────────────────────────
const StatusDot = ({ online }) => (
  <span style={{
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: online ? '#10b981' : '#64748b',
    boxShadow: online ? '0 0 6px #10b981' : 'none',
    flexShrink: 0,
  }} />
);

const Bubble = ({ msg }) => {
  const isAgent = msg.sender === 'agent';
  const isImage = msg.mediaType === 'image';
  const isVideo = msg.mediaType === 'video';
  const isDoc = msg.mediaType === 'document' || msg.mediaType === 'audio';

  return (
    <div style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div
        className={isAgent ? 'chat-bubble-agent' : 'chat-bubble-contact'}
        style={{
          maxWidth: '70%',
          padding: '11px 15px',
          fontSize: 13.5,
          lineHeight: 1.5,
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {/* Media Preview Render */}
        {isImage && (
          <div style={{ marginBottom: (msg.caption || msg.text) ? 8 : 0 }}>
            {msg.mediaUrl ? (
              <img
                src={msg.mediaUrl}
                alt={msg.mediaName || 'Attached Image'}
                style={{
                  maxWidth: '100%',
                  borderRadius: 8,
                  maxHeight: 260,
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.12)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Image size={22} color="#10b981" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{msg.mediaName || 'Image Attachment'}</div>
                  {msg.fileSize && <div style={{ fontSize: 10.5, opacity: 0.8 }}>{msg.fileSize}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {isVideo && (
          <div style={{ marginBottom: (msg.caption || msg.text) ? 8 : 0 }}>
            {msg.mediaUrl ? (
              <video
                src={msg.mediaUrl}
                controls
                style={{
                  maxWidth: '100%',
                  borderRadius: 8,
                  maxHeight: 240,
                  display: 'block'
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.12)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Video size={22} color="#3b82f6" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{msg.mediaName || 'Video Attachment'}</div>
                  {msg.fileSize && <div style={{ fontSize: 10.5, opacity: 0.8 }}>{msg.fileSize}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {isDoc && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            marginBottom: msg.caption ? 8 : 0,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <FileText size={22} color="#f59e0b" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                fontSize: 12.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {msg.mediaName || 'Brochure / Document'}
              </div>
              {msg.fileSize && <div style={{ fontSize: 10.5, opacity: 0.8 }}>{msg.fileSize}</div>}
            </div>
            <span style={{
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(245,158,11,0.2)',
              color: '#f59e0b',
              fontWeight: 800
            }}>
              DOC
            </span>
          </div>
        )}

        {/* Caption or Message Text */}
        {msg.caption ? (
          <div>{msg.caption}</div>
        ) : (!isImage && !isVideo && !isDoc) ? (
          <div>{msg.text}</div>
        ) : null}

        <div style={{
          fontSize: 10.5, marginTop: 5, opacity: 0.75,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
        }}>
          <span>{msg.timestamp}</span>
          {isAgent && (
            msg.status === 'delivered' ? <CheckCheck size={12} color="#60a5fa" /> :
            msg.status === 'read'      ? <CheckCheck size={12} color="#10b981" /> :
            <CheckCheck size={12} />
          )}
          {msg.isTemplate && (
            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: 4 }}>
              template
            </span>
          )}
          {msg.isAiGenerated && (
            <span style={{ fontSize: 9.5, background: 'rgba(16,185,129,0.25)', color: '#10b981', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              🤖 AI RAG
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Template Sender Modal
// ─────────────────────────────────────────────
const TemplateSender = ({ chatPhone, onClose, onSent }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  // Don't pre-fill with your own registered number — Meta won't allow sending to self
  const [toPhone, setToPhone] = useState(
    chatPhone && chatPhone.replace(/[^0-9]/g, '') !== '919344914311'
      ? chatPhone.replace(/[^0-9]/g, '')
      : ''
  );
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/webhooks/templates');
        const list = res.data?.templates || [];
        setTemplates(list);
        // Auto-select first APPROVED template that isn't the restricted hello_world
        const firstUsable = list.find(t => t.status === 'APPROVED' && t.name !== 'hello_world')
          || list.find(t => t.status === 'APPROVED')
          || list[0];
        if (firstUsable) setSelected(firstUsable);
      } catch (err) {
        setLoadError('Could not load templates from Meta. Check your WABA credentials.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSend = async () => {
    if (!selected) { toast.error('Select a template'); return; }
    if (!toPhone)  { toast.error('Enter recipient phone number'); return; }
    const cleaned = toPhone.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) { toast.error('Enter valid phone with country code e.g. 919876543210'); return; }
    setSending(true);
    setSendError('');
    try {
      const res = await api.post('/webhooks/send-template', {
        toPhone: cleaned,
        templateName: selected.name,
        languageCode: selected.language || 'en_US',
      });
      if (res.data?.success) {
        toast.success(`✅ Template "${selected.name}" sent to +${cleaned}`);
        onSent?.({
          template: selected,
          toPhone: cleaned,
          waMessageId: res.data?.waMessageId,
          conversation: res.data?.conversation,
        });
        onClose();
      } else {
        setSendError(res.data?.error || 'Unknown Meta error — check Meta Business Manager');
      }
    } catch (err) {
      setSendError(err.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>📋 Send WhatsApp Template</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Only APPROVED templates can be sent as first-contact messages via Meta.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Recipient Phone */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
            RECIPIENT PHONE (digits only, with country code)
          </label>
          <input
            type="text"
            value={toPhone}
            onChange={e => setToPhone(e.target.value)}
            placeholder="91XXXXXXXXXX  (e.g. 919876543210)"
            className="input-field"
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            ⚠️ Cannot send to your own registered number (+919344914311). Enter a customer's number.
          </p>
        </div>

        {/* Template list */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            SELECT APPROVED TEMPLATE
          </label>

          {loading && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <Loader size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13 }}>Loading from Meta WABA…</p>
            </div>
          )}

          {loadError && (
            <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ fontSize: 13, color: '#ef4444' }}>{loadError}</span>
            </div>
          )}

          {!loading && !loadError && templates.length === 0 && (
            <div style={{ padding: 18, border: '1px dashed var(--border-card)', borderRadius: 10, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No templates found in your WABA. Create them in Meta Business Manager.
            </div>
          )}

          {!loading && templates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {templates.map(t => {
                // hello_world is restricted to Meta test numbers only
                const isRestricted = t.name === 'hello_world';
                const isSelected = selected?.name === t.name;
                return (
                  <div
                    key={t.name}
                    onClick={() => !isRestricted && setSelected(t)}
                    title={isRestricted ? 'Meta restricts hello_world to public test numbers only — cannot use in production' : ''}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1px solid ${isSelected ? '#10b981' : isRestricted ? 'rgba(239,68,68,0.25)' : 'var(--border-card)'}`,
                      background: isSelected ? 'rgba(16,185,129,0.08)' : isRestricted ? 'rgba(239,68,68,0.04)' : 'var(--bg-tertiary)',
                      cursor: isRestricted ? 'not-allowed' : 'pointer',
                      opacity: isRestricted ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: isRestricted ? 'var(--text-muted)' : 'var(--text-primary)' }}>{t.name}</span>
                        <span style={{ fontSize: 11, marginLeft: 8, color: 'var(--text-muted)' }}>
                          [{t.language}] • {t.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isRestricted && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            🚫 Test Numbers Only
                          </span>
                        )}
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                          background: t.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: t.status === 'APPROVED' ? '#10b981' : '#f59e0b',
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    {t.components?.find(c => c.type === 'BODY')?.text && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                        {t.components.find(c => c.type === 'BODY').text.substring(0, 120)}
                        {t.components.find(c => c.type === 'BODY').text.length > 120 ? '…' : ''}
                      </p>
                    )}
                    {isRestricted && (
                      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, fontStyle: 'italic' }}>
                        ⚠️ This template can only be sent from Meta's public test phone numbers, not from your production number.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sendError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Meta Send Error</p>
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{sendError}</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSend} className="btn-primary" disabled={sending || !selected}>
            {sending ? <Loader size={14} className="spin" /> : <Send size={14} />}
            <span>{sending ? 'Sending…' : 'Send Template'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// New Direct Chat Modal (send to any number)
// ─────────────────────────────────────────────
const NewChatModal = ({ onClose, onCreated }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [openTemplateSender, setOpenTemplateSender] = useState(false);

  const handleCreate = () => {
    if (!phone) { toast.error('Enter a phone number'); return; }
    const formatted = phone.startsWith('+') ? phone : `+${phone}`;
    const chat = {
      id: 'chat-' + Date.now(),
      name: name || `Contact (${formatted})`,
      phone: formatted,
      avatar: (name || 'WA').slice(0, 2).toUpperCase(),
      unread: 0,
      online: false,
      lastMessage: '',
      lastMessageTime: '',
      aiStatus: 'AI Co-pilot Active',
      messages: [],
    };
    onCreated(chat);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>📱 Start New WhatsApp Chat</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CUSTOMER NAME</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh Sharma" className="input-field" style={{ marginTop: 5 }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>PHONE NUMBER (with country code) *</label>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="919344914311" className="input-field" style={{ marginTop: 5 }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          ⚠️ To start a new conversation with a customer who has NOT messaged you, you must send a <strong>pre-approved template</strong> first.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleCreate} className="btn-primary">Open Chat</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Inbox Component
// ─────────────────────────────────────────────
const Inbox = () => {
  const { user, canSendMessages, canBulkBroadcast } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [showTemplateSender, setShowTemplateSender] = useState(false);
  const [showBulkSender, setShowBulkSender] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [metaStatus, setMetaStatus] = useState(null);
  const [search, setSearch] = useState('');
  
  // Media Attachment States
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [stagedMedia, setStagedMedia] = useState(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // ── File Selection & Attachment Handlers ─────────────────
  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds WhatsApp 25MB limit');
      return;
    }

    let previewUrl = null;
    if (type === 'image' || type === 'video') {
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (err) {}
    }

    setStagedMedia({
      file,
      type,
      previewUrl,
      name: file.name,
      size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`,
    });
    setShowAttachMenu(false);
    e.target.value = '';
  };

  const cancelStagedMedia = () => {
    if (stagedMedia?.previewUrl) {
      URL.revokeObjectURL(stagedMedia.previewUrl);
    }
    setStagedMedia(null);
    setMediaCaption('');
  };

  const handleSendMedia = async () => {
    if (!stagedMedia || !activeChatId || uploadingMedia) return;
    setUploadingMedia(true);
    const toastId = toast.loading(`Uploading & dispatching ${stagedMedia.type.toUpperCase()} via WhatsApp Cloud API...`);

    const optimisticMsg = {
      id: 'opt-media-' + Date.now(),
      sender: 'agent',
      text: mediaCaption ? `${mediaCaption} (📎 ${stagedMedia.name})` : `📎 [${stagedMedia.type.toUpperCase()}: ${stagedMedia.name}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      mediaType: stagedMedia.type,
      mediaName: stagedMedia.name,
      fileSize: stagedMedia.size,
      mediaUrl: stagedMedia.previewUrl,
      caption: mediaCaption || null,
    };

    setChats(prev => prev.map(c => c.id === activeChatId
      ? {
          ...c,
          messages: [...c.messages, optimisticMsg],
          lastMessage: optimisticMsg.text,
          lastMessageTime: 'Just now',
        }
      : c));

    try {
      const formData = new FormData();
      formData.append('file', stagedMedia.file);
      if (mediaCaption.trim()) {
        formData.append('caption', mediaCaption.trim());
      }

      const res = await api.post(`/chat/${activeChatId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const serverMsg = res.data?.message;
      setChats(prev => prev.map(c => c.id === activeChatId
        ? {
            ...c,
            messages: c.messages.map(m => m.id === optimisticMsg.id ? (serverMsg || { ...optimisticMsg, status: 'sent' }) : m),
          }
        : c));

      toast.success(`✅ ${stagedMedia.type.toUpperCase()} delivered to customer!`, { id: toastId });
      cancelStagedMedia();
    } catch (err) {
      toast.error(`❌ Delivery failed: ${err.response?.data?.error || err.message}`, { id: toastId });
      setChats(prev => prev.map(c => c.id === activeChatId
        ? {
            ...c,
            messages: c.messages.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m),
          }
        : c));
    } finally {
      setUploadingMedia(false);
    }
  };

  // ── AI Sales Co-Pilot Generation via PageIndex Vectorless RAG + LangChain ──
  const handleGenerateAiReply = async () => {
    if (!activeChatId) return;
    setGeneratingAi(true);
    try {
      const chat = chats.find(c => c.id === activeChatId);
      const lastInbound = [...(chat?.messages || [])].reverse().find(m => m.sender === 'contact')?.text 
        || chat?.lastMessage 
        || 'Hello, I need assistance with Tata cars.';
      
      toast.loading('🧠 Reasoning with PageIndex Vectorless RAG...', { id: 'ai-gen' });
      const res = await api.post(`/chat/${activeChatId}/ai-reply`, {
        userMessage: lastInbound,
      });

      if (res.data?.reply) {
        setInputText(res.data.reply);
        const sourceLabel = res.data.source === 'pageindex_vectorless_rag' 
          ? '🌲 PageIndex Vectorless Tree' 
          : res.data.source === 'langchain_openai' 
            ? '🤖 LangChain LLM' 
            : '✨ Sales Knowledge Engine';
        toast.success(`Draft ready from ${sourceLabel}`, { id: 'ai-gen' });
      } else {
        toast.dismiss('ai-gen');
      }
    } catch (err) {
      toast.error('AI Reply error: ' + (err.response?.data?.error || err.message), { id: 'ai-gen' });
    } finally {
      setGeneratingAi(false);
    }
  };

  // ── Fetch real conversations from server ──────────────
  const fetchChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      const res = await api.get('/chat');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setChats(res.data);
        setActiveChatId(prev => prev || res.data[0]?.id);
      }
    } catch {
      // will show empty state
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // ── Fetch Meta account status ─────────────────────────
  const fetchMetaStatus = useCallback(async () => {
    try {
      const res = await api.get('/webhooks/status');
      setMetaStatus(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchChats();
    fetchMetaStatus();
  }, []);

  // ── Real-time Socket.io ───────────────────────────────
  useSocket(
    (data) => {
      // incoming message OR agent-sent message echoed back
      const eventChat = data?.chatId;
      const msg = data?.message;
      if (!eventChat || !msg) return;

      setChats(prev => {
        const exists = prev.find(c => c.id === eventChat);
        if (exists) {
          return prev.map(c => c.id === eventChat
            ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastMessageTime: 'Just now', unread: c.id === activeChatId ? 0 : (c.unread || 0) + 1 }
            : c);
        }
        if (data.chat) {
          return [data.chat, ...prev];
        }
        return prev;
      });

      setActiveChatId(prev => prev || eventChat);
      fetchChats();
    },
    null
  );

  // Auto-scroll inside chat area only (never scrolls parent or card-glass container)
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chats, activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId || c._id === activeChatId);

  // ── Send real WhatsApp text message ──────────────────
  const handleSend = async () => {
    if (!inputText.trim() || !activeChat || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic UI
    const optimistic = {
      id: 'opt-' + Date.now(),
      sender: 'agent',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };
    setChats(prev => prev.map(c => c.id === activeChatId
      ? { ...c, messages: [...c.messages, optimistic], lastMessage: text, lastMessageTime: 'Just now' }
      : c));

    try {
      const res = await api.post(`/chat/${activeChatId}/messages`, { text });
      const serverMsg = res.data?.message;
      // Replace optimistic with server-confirmed
      setChats(prev => prev.map(c => c.id === activeChatId
        ? { ...c, messages: c.messages.map(m => m.id === optimistic.id ? { ...optimistic, ...(serverMsg || {}), status: 'sent' } : m) }
        : c));
    } catch (err) {
      toast.error(`❌ Failed to send: ${err.response?.data?.error || err.message}`);
      // mark failed
      setChats(prev => prev.map(c => c.id === activeChatId
        ? { ...c, messages: c.messages.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m) }
        : c));
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSent = ({ template, toPhone, waMessageId, conversation }) => {
    if (conversation) {
      setChats(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        if (exists) {
          return prev.map(c => c.id === conversation.id ? conversation : c);
        }
        return [conversation, ...prev];
      });
      setActiveChatId(conversation.id);
      return;
    }

    const formatted = toPhone ? (toPhone.startsWith('+') ? toPhone : `+${toPhone}`) : '';
    const msg = {
      id: 'tmpl-' + Date.now(),
      sender: 'agent',
      text: `[Template: ${template.name}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isTemplate: true,
      waMessageId,
    };

    setChats(prev => {
      const match = prev.find(c => c.phone.replace(/[^0-9]/g, '') === (toPhone || '').replace(/[^0-9]/g, ''));
      if (match) {
        return prev.map(c => c.id === match.id
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastMessageTime: 'Just now' }
          : c);
      }
      const newChat = {
        id: 'chat-' + Date.now(),
        name: `Contact (${formatted})`,
        phone: formatted,
        avatar: 'WA',
        unread: 0,
        online: true,
        lastMessage: msg.text,
        lastMessageTime: 'Just now',
        aiStatus: 'AI Co-pilot Active',
        messages: [msg],
      };
      setActiveChatId(newChat.id);
      return [newChat, ...prev];
    });
  };

  const filteredChats = chats.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  // ─────────────────────────────────────────────────────
  return (
    <div className="page-body" style={{ padding: '12px 24px 20px' }}>

      {/* Main Chat UI - Expanded Height & Sleek Glass Styling */}
      <div className="card-glass" style={{
        display: 'flex',
        height: 'calc(100vh - 130px)',
        minHeight: '560px',
        maxHeight: 'calc(100vh - 130px)',
        padding: 0,
        overflow: 'hidden',
        borderRadius: 16,
        border: '1px solid var(--border-card)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      }}>
        {/* ── Left: Conversation List ── */}
        <div style={{
          width: '330px',
          minWidth: '330px',
          maxWidth: '330px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-card)',
          background: 'var(--bg-card)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Header & Quick Action Buttons */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-card)', flexShrink: 0, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>Conversations</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: 'rgba(16,185,129,0.14)',
                  color: '#10b981',
                  padding: '2px 8px',
                  borderRadius: 99
                }}>
                  {filteredChats.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button 
                  onClick={fetchChats} 
                  title="Refresh Chats" 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 5, borderRadius: 6 }}
                >
                  <RefreshCw size={13} className={loadingChats ? 'spin' : ''} />
                </button>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, borderRadius: 6 }}
                  title="Start New WhatsApp Chat"
                >
                  <Plus size={13} />
                  <span>New</span>
                </button>
                <button
                  onClick={() => {
                    if (!canBulkBroadcast()) {
                      toast.error('Bulk broadcast requires Admin or Sales Team access.');
                      return;
                    }
                    setShowBulkSender(true);
                  }}
                  className="btn-primary"
                  style={{
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: 6,
                    background: canBulkBroadcast() ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#64748b',
                  }}
                  title="Bulk Send Approved Templates via CSV"
                >
                  <FileSpreadsheet size={13} />
                  <span>Bulk</span>
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)', padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-card)' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search phone or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 13, color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {loadingChats && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13 }}>Loading conversations…</p>
              </div>
            )}
            {!loadingChats && filteredChats.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <MessageSquare size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No conversations yet.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Customers who message your WhatsApp number will appear here.</p>
              </div>
            )}
            {filteredChats.map(c => {
              const currentChatId = c.id || c._id;
              const isSelected = activeChat && ((activeChat.id === currentChatId) || (activeChat._id === currentChatId) || (activeChatId === currentChatId));
              return (
                <div
                  key={currentChatId}
                  onClick={() => setActiveChatId(currentChatId)}
                  className="conversation-card-item"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '13px 16px', cursor: 'pointer',
                    background: isSelected ? 'rgba(16,185,129,0.08)' : 'transparent',
                    borderLeft: `4px solid ${isSelected ? '#10b981' : 'transparent'}`,
                    borderBottom: '1px solid var(--border-subtle)',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 13.5,
                    boxShadow: isSelected ? '0 0 14px rgba(16,185,129,0.35)' : '0 2px 6px rgba(0,0,0,0.1)'
                  }}>
                    {c.avatar || (c.name ? c.name.slice(0, 2).toUpperCase() : 'WA')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name || 'WhatsApp Contact'}
                      </h4>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
                        {c.lastMessageTime || ''}
                      </span>
                    </div>

                    {/* PHONE NUMBER - Prominently displayed */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 3,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                      <Phone size={10.5} color="#10b981" />
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.3px',
                      }}>
                        {c.phone}
                      </span>
                    </div>

                    {/* Last message preview */}
                    <p style={{
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: 4
                    }}>
                      {c.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {c.unread > 0 && (
                    <span style={{
                      background: '#10b981',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 99,
                      flexShrink: 0,
                      marginTop: 4
                    }}>
                      {c.unread}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Active Chat ── */}
        {!activeChat ? (
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontWeight: 700 }}>Select a conversation</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>or start a new one using "New Chat"</p>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat Header */}
            <div style={{
              flexShrink: 0,
              padding: '14px 20px', borderBottom: '1px solid var(--border-card)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                  fontSize: 15,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                }}>
                  {activeChat.avatar}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{activeChat.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      <Phone size={11} color="#10b981" />
                      <span>{activeChat.phone}</span>
                    </div>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#10b981', fontWeight: 700, fontSize: 11.5 }}>
                      <StatusDot online={true} /> Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side: Single Clean Send Template Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setShowTemplateSender(true)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 8,
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10b981',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Send approved WhatsApp template"
                >
                  <FileText size={15} />
                  <span>Send Template</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatAreaRef} className="inbox-chat-area" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 18px' }}>
              {activeChat.messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <Bot size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <p>No messages yet.</p>
                  <p style={{ marginTop: 4, fontSize: 12 }}>
                    Send a <strong>pre-approved template</strong> to start the conversation.
                  </p>
                </div>
              ) : (
                activeChat.messages.map(msg => <Bubble key={msg.id} msg={msg} />)
              )}
            </div>

            {/* Input Bar & Attachment Controls */}
            <div style={{ flexShrink: 0, padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-card)', position: 'relative' }}>
              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={imageInputRef}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e, 'image')}
              />
              <input
                type="file"
                ref={videoInputRef}
                accept="video/mp4,video/3gpp,video/quicktime"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e, 'video')}
              />
              <input
                type="file"
                ref={docInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e, 'document')}
              />

              {/* Attachment Popover Dropdown */}
              {showAttachMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: stagedMedia ? 130 : 68,
                    left: 16,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 12,
                    padding: '8px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    zIndex: 50,
                    minWidth: 200,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px', letterSpacing: '0.5px' }}>
                    SELECT ATTACHMENT
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Image size={17} color="#10b981" />
                    <div>
                      <div>Photos & Images</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 400 }}>PNG, JPG, WebP</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Video size={17} color="#3b82f6" />
                    <div>
                      <div>Videos & Clips</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 400 }}>MP4, 3GP, Walkarounds</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={17} color="#f59e0b" />
                    <div>
                      <div>Documents & PDFs</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 400 }}>Brochures, Quotations, Specs</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Staged Media Preview Tray */}
              {stagedMedia && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    marginBottom: 10,
                    borderRadius: 10,
                    background: 'rgba(16,185,129,0.08)',
                    border: '1.5px solid rgba(16,185,129,0.3)',
                    position: 'relative',
                  }}
                >
                  {/* Thumbnail / Icon */}
                  {stagedMedia.type === 'image' && stagedMedia.previewUrl ? (
                    <img
                      src={stagedMedia.previewUrl}
                      alt="Preview"
                      style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.1)' }}
                    />
                  ) : stagedMedia.type === 'video' ? (
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={22} color="#3b82f6" />
                    </div>
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={22} color="#f59e0b" />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stagedMedia.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {stagedMedia.type.toUpperCase()} • {stagedMedia.size}
                    </div>
                  </div>

                  {/* Caption Input for Attachment */}
                  <input
                    type="text"
                    value={mediaCaption}
                    onChange={e => setMediaCaption(e.target.value)}
                    placeholder="Add caption (optional)..."
                    className="input-field"
                    style={{ flex: 1.4, padding: '7px 12px', fontSize: 12.5 }}
                  />

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={cancelStagedMedia}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      title="Cancel attachment"
                    >
                      <X size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendMedia}
                      disabled={uploadingMedia}
                      className="btn-primary"
                      style={{
                        padding: '6px 14px',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      }}
                    >
                      {uploadingMedia ? <Loader size={14} className="spin" /> : <Send size={14} />}
                      <span>{uploadingMedia ? 'Uploading…' : 'Send File'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Read-Only Notice for Standard User Role */}
              {!canSendMessages() ? (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1.5px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>
                    <Lock size={18} />
                    <span>Standard User Access: Live chats are in Read-Only view. Switch to Sales Team or Admin Control to reply or send attachments.</span>
                  </div>
                </div>
              ) : (
                /* Active Input Bar for Admin and Sales Team */
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(prev => !prev)}
                    className="btn-secondary"
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: showAttachMenu ? 'rgba(16,185,129,0.15)' : 'var(--bg-tertiary)',
                      border: showAttachMenu ? '1.5px solid #10b981' : '1px solid var(--border-card)',
                      color: showAttachMenu ? '#10b981' : 'var(--text-primary)',
                      cursor: 'pointer',
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                    title="Attach Image, Video, or Document brochure"
                  >
                    <Paperclip size={17} />
                    <span style={{ fontWeight: 700 }}>Attach</span>
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field"
                    style={{ flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13.5 }}
                  />

                  {/* Quick AI Sales Draft Co-pilot */}
                  <button
                    type="button"
                    onClick={handleGenerateAiReply}
                    disabled={generatingAi}
                    className="btn-secondary"
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(16,185,129,0.08)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)',
                      cursor: 'pointer',
                      borderRadius: 10,
                      transition: 'all 0.2s ease',
                    }}
                    title="Generate AI sales response draft"
                  >
                    {generatingAi ? <Loader size={16} className="spin" /> : <Sparkles size={16} />}
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      padding: '10px 22px',
                      borderRadius: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    }}
                    disabled={sending}
                  >
                    {sending ? <Loader size={15} className="spin" /> : <Send size={15} />}
                    <span>{sending ? 'Sending…' : 'Send'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplateSender && (
        <TemplateSender
          chatPhone={activeChat?.phone}
          onClose={() => setShowTemplateSender(false)}
          onSent={handleTemplateSent}
        />
      )}
      {showBulkSender && (
        <BulkTemplateSenderModal
          onClose={() => setShowBulkSender(false)}
          onCompleted={(result) => {
            fetchChats();
          }}
        />
      )}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={chat => {
            setChats(prev => [chat, ...prev]);
            setActiveChatId(chat.id);
          }}
        />
      )}
    </div>
  );
};

export default Inbox;
