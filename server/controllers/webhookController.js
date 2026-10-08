import Lead from '../models/Lead.js';
import Contact from '../models/Contact.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import mongoose from 'mongoose';
import { getAccountDetails, markMessageAsRead, getTemplates, sendTemplateMessage, sendTextMessage } from '../services/whatsappService.js';
import { memoryConversations, upsertConversationToDB } from './chatController.js';
import { queryVectorlessRAG } from '../services/pageIndexRAGService.js';

export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'whatsapp_crm_verify_secure_token_99';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ [Webhook] Meta WhatsApp Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    }
    console.warn('⚠️ [Webhook] Verification token mismatch:', { token, expected: VERIFY_TOKEN });
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
};

export const receiveWebhook = async (req, res) => {
  const body = req.body;
  console.log('📩 [Webhook] Incoming Meta WhatsApp Event:', JSON.stringify(body, null, 2));

  // Acknowledge Meta immediately to avoid retries
  res.status(200).send('EVENT_RECEIVED');

  try {
    if (body.object === 'whatsapp_business_account' || body.entry) {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          // 1. Handle Status updates (sent, delivered, read, failed)
          if (value.statuses && Array.isArray(value.statuses)) {
            for (const statusObj of value.statuses) {
              const { id: waMessageId, status, recipient_id } = statusObj;
              console.log(`ℹ️ [Webhook] Message ${waMessageId} status to ${recipient_id}: ${status}`);

              // Broadcast status to CRM clients
              if (req.io) {
                req.io.emit('whatsapp:status_update', {
                  waMessageId,
                  status,
                  recipientId: recipient_id,
                });
              }
            }
          }

          // 2. Handle Incoming WhatsApp Messages
          if (value.messages && Array.isArray(value.messages)) {
            const contactInfo = value.contacts?.[0] || {};
            const senderName = contactInfo.profile?.name || 'WhatsApp Contact';

            for (const msg of value.messages) {
              const senderPhone = msg.from; // E.164 without +, e.g. 919820144521
              const formattedPhone = senderPhone.startsWith('+') ? senderPhone : `+${senderPhone}`;
              
              // Robust multi-type WhatsApp message extraction (Text, Template Quick-Reply Button, Interactive Button Reply, List)
              let messageText = '';
              if (msg.type === 'text') {
                messageText = msg.text?.body || '';
              } else if (msg.type === 'button') {
                messageText = msg.button?.text || msg.button?.payload || 'Interested';
              } else if (msg.type === 'interactive') {
                if (msg.interactive?.type === 'button_reply') {
                  messageText = msg.interactive?.button_reply?.title || msg.interactive?.button_reply?.id || 'Interested';
                } else if (msg.interactive?.type === 'list_reply') {
                  messageText = msg.interactive?.list_reply?.title || 'Selected option';
                } else {
                  messageText = msg.interactive?.button_reply?.title || 'Interested';
                }
              } else if (msg.type === 'image') {
                messageText = msg.image?.caption || '📷 [Image received]';
              } else if (msg.type === 'video') {
                messageText = msg.video?.caption || '🎥 [Video received]';
              } else if (msg.type === 'document') {
                messageText = msg.document?.caption || `📄 [Document: ${msg.document?.filename || 'File'}]`;
              } else {
                messageText = msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || `[${msg.type} message received]`;
              }

              const waMessageId = msg.id;
              const timestampStr = new Date(parseInt(msg.timestamp) * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              console.log(`💬 [Webhook] Received from ${senderName} (${formattedPhone}) [Type: ${msg.type}]: "${messageText}"`);

              // Automatically mark message as read
              markMessageAsRead(waMessageId).catch(() => {});

              // Match in memory or MongoDB
              let chat = memoryConversations.find(
                (c) => c.phone && c.phone.replace(/[^0-9]/g, '') === senderPhone.replace(/[^0-9]/g, '')
              );
              if (!chat && mongoose.connection.readyState === 1) {
                try {
                  const dbConv = await Conversation.findOne({
                    phone: { $regex: senderPhone.replace(/[^0-9]/g, '').slice(-10) }
                  }).lean();
                  if (dbConv) {
                    chat = dbConv;
                    memoryConversations.unshift(chat);
                  }
                } catch (dbErr) {
                  console.warn('[Webhook] DB conv lookup error:', dbErr.message);
                }
              }

              const incomingMsgObj = {
                id: 'msg-' + Date.now(),
                sender: 'contact',
                text: messageText,
                timestamp: timestampStr,
                waMessageId,
              };

              const isInterestedAction = messageText.toLowerCase().includes('interest') || (msg.type === 'button' || msg.type === 'interactive');

              if (!chat) {
                // Create new conversation
                const initials = senderName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'WA';

                chat = {
                  id: 'chat-' + Date.now(),
                  name: senderName,
                  phone: formattedPhone,
                  avatar: initials,
                  unread: 1,
                  online: true,
                  lastMessage: messageText,
                  lastMessageTime: 'Just now',
                  aiStatus: 'AI Co-pilot Active',
                  messages: [incomingMsgObj],
                };
                memoryConversations.unshift(chat);

                // Auto-create / update Lead as HOT Inquiry if "Interested" was clicked
                try {
                  if (mongoose.connection.readyState === 1) {
                    await Lead.findOneAndUpdate(
                      { phone: formattedPhone },
                      {
                        name: senderName,
                        phone: formattedPhone,
                        source: 'WhatsApp Cloud API',
                        stage: isInterestedAction ? 'Inquiry - Hot' : 'Inquiry - Warm',
                        priority: isInterestedAction ? 'Hot' : 'Warm',
                        purchaseTimeline: isInterestedAction ? '10 - 15 Days' : '1 Month',
                        notes: `Inbound WhatsApp: "${messageText}"${isInterestedAction ? ' (Customer clicked Interested button)' : ''}`,
                      },
                      { upsert: true, new: true }
                    );
                  }
                } catch (e) {
                  console.error('[Webhook] Lead upsert error:', e.message);
                }
              } else {
                chat.messages = chat.messages || [];
                chat.messages.push(incomingMsgObj);
                chat.lastMessage = messageText;
                chat.lastMessageTime = 'Just now';
                chat.unread = (chat.unread || 0) + 1;

                if (isInterestedAction && mongoose.connection.readyState === 1) {
                  try {
                    await Lead.findOneAndUpdate(
                      { phone: formattedPhone },
                      {
                        stage: 'Inquiry - Hot',
                        priority: 'Hot',
                        purchaseTimeline: '10 - 15 Days',
                        $push: {
                          followUpHistory: {
                            date: new Date(),
                            type: 'WhatsApp',
                            notes: `Customer clicked Interested button on WhatsApp: "${messageText}"`,
                            executive: 'WhatsApp AI Bot'
                          }
                        }
                      }
                    );
                  } catch (e) {}
                }
              }

              // 100% Persistence to MongoDB
              await upsertConversationToDB(chat);

              // Broadcast real-time to active CRM agents via Socket.io
              if (req.io) {
                const payload = {
                  chatId: chat.id,
                  message: incomingMsgObj,
                  chat: chat,
                  contact: {
                    name: senderName,
                    phone: formattedPhone,
                  },
                };
                req.io.emit('whatsapp:incoming_message', payload);
                req.io.emit('whatsapp:incoming', payload);
              }

              // ── Automated Vectorless RAG Sales Assistant ─────────
              const isAiEnabled = process.env.AI_SALES_BOT_ENABLED !== 'false' && chat.aiStatus !== 'AI Off';
              if (isAiEnabled) {
                (async () => {
                  try {
                    console.log(`🤖 [AI Sales Assistant] Consulting Vectorless PageIndex RAG for ${formattedPhone}...`);
                    const ragAnswer = await queryVectorlessRAG(messageText, chat.messages);
                    if (ragAnswer && ragAnswer.reply) {
                      // Send real reply to user on WhatsApp
                      const waSendRes = await sendTextMessage(formattedPhone, ragAnswer.reply);
                      
                      const aiReplyMsg = {
                        id: 'msg-' + Date.now(),
                        sender: 'agent',
                        text: ragAnswer.reply,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        waMessageId: waSendRes?.waMessageId,
                        status: waSendRes?.success ? 'sent' : 'failed',
                        isAiGenerated: true,
                      };

                      chat.messages.push(aiReplyMsg);
                      chat.lastMessage = ragAnswer.reply;
                      chat.lastMessageTime = 'Just now';
                      await upsertConversationToDB(chat);

                      if (req.io) {
                        req.io.emit('chat:message_sent', { chatId: chat.id, message: aiReplyMsg });
                      }
                      console.log(`✅ [AI Sales Assistant] Replied via ${ragAnswer.source} to ${formattedPhone}`);
                    }
                  } catch (aiErr) {
                    console.error('❌ [AI Sales Assistant] Failed to generate/send auto-reply:', aiErr.message);
                  }
                })();
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ [Webhook] Error processing webhook event:', err);
  }
};

export const getMetaStatus = async (req, res) => {
  try {
    const details = await getAccountDetails();
    res.json(details);
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
};

export const getMetaTemplates = async (req, res) => {
  try {
    const result = await getTemplates();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, templates: [] });
  }
};

export const sendWhatsAppTemplate = async (req, res) => {
  const { toPhone, templateName, languageCode, components } = req.body;
  if (!toPhone || !templateName) {
    return res.status(400).json({ success: false, error: 'toPhone and templateName are required' });
  }
  try {
    const result = await sendTemplateMessage(toPhone, templateName, languageCode || 'en_US', components || []);
    
    // Automatically create or update conversation in memory so it appears in CRM Inbox
    const formattedPhone = toPhone.startsWith('+') ? toPhone : `+${toPhone}`;
    let conv = memoryConversations.find(
      (c) => c.phone.replace(/[^0-9]/g, '') === toPhone.replace(/[^0-9]/g, '')
    );

    const msgObj = {
      id: 'tmpl-' + Date.now(),
      sender: 'agent',
      text: `[Template: ${templateName}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waMessageId: result?.waMessageId,
      status: result?.success ? 'sent' : 'failed',
      isTemplate: true,
    };

    if (!conv) {
      conv = {
        id: 'chat-' + Date.now(),
        name: `Contact (${formattedPhone})`,
        phone: formattedPhone,
        avatar: 'WA',
        unread: 0,
        online: true,
        lastMessage: `[Template: ${templateName}]`,
        lastMessageTime: 'Just now',
        aiStatus: 'AI Co-pilot Active',
        messages: [msgObj],
      };
      memoryConversations.unshift(conv);
    } else {
      conv.messages.push(msgObj);
      conv.lastMessage = `[Template: ${templateName}]`;
      conv.lastMessageTime = 'Just now';
    }

    await upsertConversationToDB(conv);

    if (req.io) {
      req.io.emit('whatsapp:template_sent', { toPhone: formattedPhone, templateName, result, conversation: conv });
      req.io.emit('chat:message_sent', { chatId: conv.id, message: msgObj });
    }

    res.json({ ...result, conversation: conv });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
