const Message = require('../models/Message');
const Lead = require('../models/Lead');
const { sendTextMessage, sendTemplateMessage } = require('../services/whatsappService');

// GET /api/messages/:phone - Get conversation history
const getConversation = async (req, res) => {
  const { phone } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [messages, total] = await Promise.all([
    Message.find({ contactPhone: phone }).sort({ timestamp: 1 }).skip(skip).limit(parseInt(limit)),
    Message.countDocuments({ contactPhone: phone }),
  ]);

  res.json({ success: true, data: messages, pagination: { total, page: parseInt(page) } });
};

// GET /api/messages/conversations - Get unique conversations (inbox)
const getConversations = async (req, res) => {
  const conversations = await Message.aggregate([
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: '$contactPhone',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$direction', 'inbound'] }, { $eq: ['$status', 'received'] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { 'lastMessage.timestamp': -1 } },
    { $limit: 100 },
  ]);

  // Enrich with lead info
  const phones = conversations.map((c) => c._id);
  const leads = await Lead.find({ phone: { $in: phones } }).select('name phone stage');
  const leadMap = {};
  leads.forEach((l) => (leadMap[l.phone] = l));

  const enriched = conversations.map((c) => ({
    ...c,
    lead: leadMap[c._id] || null,
  }));

  res.json({ success: true, data: enriched });
};

// POST /api/messages/send - Send a text message
const sendMessage = async (req, res) => {
  const { phone, message, leadId } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, message: 'phone and message are required.' });
  }

  const waResponse = await sendTextMessage(phone, message);

  const savedMessage = await Message.create({
    leadId: leadId || null,
    contactPhone: phone,
    direction: 'outbound',
    type: 'text',
    body: message,
    status: 'sent',
    waMessageId: waResponse?.messages?.[0]?.id || '',
    timestamp: new Date(),
  });

  // Update lead's lastContactedAt
  if (leadId) {
    await Lead.findByIdAndUpdate(leadId, { lastContactedAt: new Date() });
  }

  res.json({ success: true, data: savedMessage });
};

// POST /api/messages/send-template
const sendTemplate = async (req, res) => {
  const { phone, templateName, languageCode, leadId, components } = req.body;
  if (!phone || !templateName) {
    return res.status(400).json({ success: false, message: 'phone and templateName are required.' });
  }

  const waResponse = await sendTemplateMessage(phone, templateName, languageCode || 'en_US', components || []);

  const savedMessage = await Message.create({
    leadId: leadId || null,
    contactPhone: phone,
    direction: 'outbound',
    type: 'template',
    body: `Template: ${templateName}`,
    templateName,
    status: 'sent',
    waMessageId: waResponse?.messages?.[0]?.id || '',
    timestamp: new Date(),
  });

  res.json({ success: true, data: savedMessage });
};

module.exports = { getConversation, getConversations, sendMessage, sendTemplate };
