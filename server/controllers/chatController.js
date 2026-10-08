import { sendTextMessage, sendTemplateMessage, formatPhoneNumber, sendMediaMessage, uploadMedia } from '../services/whatsappService.js';
import Conversation from '../models/Conversation.js';
import Contact from '../models/Contact.js';
import mongoose from 'mongoose';
import { queryVectorlessRAG, listPageIndexDocs } from '../services/pageIndexRAGService.js';

export let memoryConversations = [];

// Helper: sync conversation to MongoDB
export const upsertConversationToDB = async (convData) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await Conversation.findOneAndUpdate(
        { phone: convData.phone },
        { ...convData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return updated;
    }
  } catch (err) {
    console.error('[DB Persistence] Error saving conversation:', err.message);
  }
  return null;
};

// Helper: load conversations from MongoDB into memory cache
export const loadConversationsFromDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbList = await Conversation.find().sort({ updatedAt: -1 }).lean();
      if (dbList && dbList.length > 0) {
        memoryConversations = dbList;
      }
    }
  } catch (err) {
    console.warn('[DB Persistence] Could not load from DB:', err.message);
  }
  return memoryConversations;
};

// Initialize DB loading on module start
setTimeout(() => {
  loadConversationsFromDB();
}, 1000);

export const getConversations = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbList = await Conversation.find().sort({ updatedAt: -1 }).lean();
      if (dbList && dbList.length > 0) {
        memoryConversations = dbList;
        return res.json(dbList);
      }
    }
    res.json(memoryConversations);
  } catch (err) {
    res.json(memoryConversations);
  }
};

export const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;

  let conv = memoryConversations.find((c) => c.id === chatId);
  if (!conv && mongoose.connection.readyState === 1) {
    conv = await Conversation.findOne({ id: chatId });
  }

  const newMsg = {
    id: 'msg-' + Date.now(),
    sender: 'agent',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'sent',
    isAiGenerated: false,
  };

  let metaResult = null;
  if (conv && conv.phone) {
    // Send real message through Meta WhatsApp Cloud API
    try {
      metaResult = await sendTextMessage(conv.phone, text);
      if (metaResult?.waMessageId) {
        newMsg.waMessageId = metaResult.waMessageId;
      }
    } catch (err) {
      console.warn('[ChatController] Real WhatsApp delivery note:', err.message);
    }
  }

  if (conv) {
    conv.messages = conv.messages || [];
    conv.messages.push(newMsg);
    conv.lastMessage = text;
    conv.lastMessageTime = 'Just now';
    await upsertConversationToDB(conv);
  }

  // Real-time broadcast
  if (req.io) {
    req.io.emit('chat:message_sent', { chatId, message: newMsg });
  }

  res.status(201).json({
    message: newMsg,
    metaDelivery: metaResult,
  });
};

/**
 * Send Media Attachment (image, video, document) via WhatsApp Cloud API
 */
export const sendChatMedia = async (req, res) => {
  const { chatId } = req.params;
  const { caption } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No media file provided' });
  }

  let conv = memoryConversations.find((c) => c.id === chatId);
  if (!conv && mongoose.connection.readyState === 1) {
    conv = await Conversation.findOne({ id: chatId });
  }

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const mime = req.file.mimetype || 'application/octet-stream';
  let mediaType = 'document';
  if (mime.startsWith('image/')) mediaType = 'image';
  else if (mime.startsWith('video/')) mediaType = 'video';

  const filename = req.file.originalname || `attachment_${Date.now()}`;
  const fileSizeStr = req.file.size > 1024 * 1024
    ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${(req.file.size / 1024).toFixed(1)} KB`;

  // 1. Upload to Meta Cloud API
  let uploadResult = null;
  let metaResult = null;
  try {
    uploadResult = await uploadMedia(req.file.buffer, mime, filename);
  } catch (err) {
    console.warn('[ChatController] Meta upload notice:', err.message);
  }

  // 2. Dispatch Media Message through Meta Cloud API
  if (uploadResult?.media_id && conv.phone) {
    try {
      metaResult = await sendMediaMessage(
        conv.phone,
        mediaType,
        uploadResult.media_id,
        caption || '',
        filename
      );
    } catch (err) {
      console.warn('[ChatController] Meta sendMedia notice:', err.message);
    }
  }

  // Base64 data URI preview for images
  let mediaUrl = null;
  if (mediaType === 'image' && req.file.size < 4 * 1024 * 1024) {
    mediaUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
  }

  const newMsg = {
    id: 'msg-' + Date.now(),
    sender: 'agent',
    text: caption ? `${caption} (📎 ${filename})` : `📎 [${mediaType.toUpperCase()}: ${filename}]`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'sent',
    waMessageId: metaResult?.waMessageId || uploadResult?.media_id || null,
    isTemplate: false,
    isAiGenerated: false,
    mediaType,
    mediaName: filename,
    mediaId: uploadResult?.media_id || null,
    fileSize: fileSizeStr,
    caption: caption || null,
    mediaUrl,
  };

  conv.messages = conv.messages || [];
  conv.messages.push(newMsg);
  conv.lastMessage = newMsg.text;
  conv.lastMessageTime = 'Just now';
  await upsertConversationToDB(conv);

  if (req.io) {
    req.io.emit('chat:message_sent', { chatId, message: newMsg });
  }

  res.status(201).json({
    message: newMsg,
    metaDelivery: metaResult,
  });
};


export const sendDirectMessage = async (req, res) => {
  const { phone, text, templateName } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Recipient phone number is required' });
  }

  try {
    let result;
    if (templateName) {
      result = await sendTemplateMessage(phone, templateName);
    } else {
      result = await sendTextMessage(phone, text || 'Hello from WhatsApp CRM Pro!');
    }

    const formatted = phone.startsWith('+') ? phone : `+${phone}`;
    let conv = memoryConversations.find(
      (c) => c.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')
    );

    if (!conv && mongoose.connection.readyState === 1) {
      conv = await Conversation.findOne({ phone: formatted });
    }

    const msgObj = {
      id: 'msg-' + Date.now(),
      sender: 'agent',
      text: text || `[Template: ${templateName}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waMessageId: result?.waMessageId,
      status: result?.success ? 'sent' : 'failed',
      isTemplate: !!templateName,
    };

    if (!conv) {
      conv = {
        id: 'chat-' + phone.replace(/[^0-9]/g, ''),
        name: `Contact (${phone})`,
        phone: formatted,
        avatar: 'WA',
        unread: 0,
        online: true,
        lastMessage: text || `[Template: ${templateName}]`,
        lastMessageTime: 'Just now',
        aiStatus: 'AI Sales Assistant Active',
        messages: [msgObj],
      };
      memoryConversations.unshift(conv);
    } else {
      conv.messages.push(msgObj);
      conv.lastMessage = text || `[Template: ${templateName}]`;
      conv.lastMessageTime = 'Just now';
    }

    await upsertConversationToDB(conv);

    if (req.io) {
      req.io.emit('chat:message_sent', { chatId: conv.id, message: msgObj });
    }

    res.json({
      success: result.success,
      data: result,
      conversationId: conv.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate AI Sales Assistant reply using Vectorless PageIndex RAG + LangChain
 */
export const generateAiChatReply = async (req, res) => {
  const { chatId } = req.params;
  const { userMessage, docId } = req.body;

  try {
    let conv = memoryConversations.find((c) => c.id === chatId);
    if (!conv && mongoose.connection.readyState === 1) {
      conv = await Conversation.findOne({ id: chatId });
    }

    const question = userMessage || conv?.lastMessage || 'Hello, can you help me?';
    const history = conv?.messages || [];

    const ragResponse = await queryVectorlessRAG(question, history, docId);
    res.json({
      success: true,
      reply: ragResponse.reply,
      source: ragResponse.source,
      docId: ragResponse.docId,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * List documents indexed in PageIndex account
 */
export const getPageIndexDocuments = async (req, res) => {
  try {
    const docs = await listPageIndexDocs();
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
