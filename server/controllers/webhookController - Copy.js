const Lead = require('../models/Lead');
const Message = require('../models/Message');
const { emitNewMessage } = require('../services/socketService');

// GET /webhook/whatsapp - Meta verification handshake
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ WhatsApp Webhook verified');
    return res.status(200).send(challenge);
  }
  console.warn('❌ Webhook verification failed');
  return res.status(403).json({ message: 'Verification failed' });
};

// POST /webhook/whatsapp - Receive incoming messages from Meta
const receiveWebhook = async (req, res) => {
  // Always respond 200 quickly to Meta
  res.status(200).json({ status: 'received' });

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];

        for (const msg of messages) {
          await processIncomingMessage(msg, contacts);
        }

        // Handle status updates
        const statuses = value?.statuses || [];
        for (const status of statuses) {
          await Message.findOneAndUpdate(
            { waMessageId: status.id },
            { status: status.status },
            { new: true }
          );
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }
};

const processIncomingMessage = async (msg, waContacts) => {
  const senderPhone = msg.from; // e.g. "919043104868"
  const waMessageId = msg.id;
  const timestamp = new Date(parseInt(msg.timestamp) * 1000);

  // Extract message body
  let body = '';
  let type = msg.type || 'text';
  if (msg.type === 'text') {
    body = msg.text?.body || '';
  } else if (msg.type === 'interactive') {
    body = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
  } else {
    body = `[${msg.type} message]`;
  }

  // Get contact name from WhatsApp contacts payload
  const waContact = waContacts.find((c) => c.wa_id === senderPhone);
  const contactName = waContact?.profile?.name || senderPhone;

  // Find or create a Lead for this number
  let lead = await Lead.findOne({ $or: [{ whatsappId: senderPhone }, { phone: `+${senderPhone}` }, { phone: senderPhone }] });

  if (!lead) {
    // Auto-create lead from WhatsApp message
    lead = await Lead.create({
      name: contactName,
      phone: `+${senderPhone}`,
      whatsappId: senderPhone,
      source: 'whatsapp',
      stage: 'New',
      priority: 'medium',
      lastContactedAt: timestamp,
    });
    console.log(`✅ Auto-created lead for ${contactName} (${senderPhone})`);
  } else {
    // Update last contacted
    await Lead.findByIdAndUpdate(lead._id, {
      lastContactedAt: timestamp,
      whatsappId: senderPhone,
    });
  }

  // Save message to DB
  const savedMessage = await Message.create({
    leadId: lead._id,
    contactPhone: senderPhone,
    direction: 'inbound',
    type,
    body,
    status: 'received',
    waMessageId,
    timestamp,
  });

  // Emit real-time event to connected clients
  emitNewMessage({
    ...savedMessage.toObject(),
    leadName: contactName,
    leadId: lead._id,
  });
};

module.exports = { verifyWebhook, receiveWebhook };
