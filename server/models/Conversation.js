import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ['agent', 'contact', 'system', 'bot'], default: 'contact' },
    text: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    waMessageId: { type: String, default: null },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
    isTemplate: { type: Boolean, default: false },
    isAiGenerated: { type: Boolean, default: false },
    mediaType: { type: String, enum: ['image', 'video', 'document', null], default: null },
    mediaUrl: { type: String, default: null },
    mediaName: { type: String, default: null },
    mediaId: { type: String, default: null },
    fileSize: { type: String, default: null },
    caption: { type: String, default: null },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g. chat-919043104868
    phone: { type: String, required: true, unique: true }, // e.g. +919043104868
    name: { type: String, default: 'WhatsApp Contact' },
    avatar: { type: String, default: 'WA' },
    unread: { type: Number, default: 0 },
    online: { type: Boolean, default: true },
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: String, default: 'Just now' },
    aiStatus: { type: String, default: 'AI Sales Assistant Active' }, // AI status
    messages: [chatMessageSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
