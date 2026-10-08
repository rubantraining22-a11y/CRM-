const axios = require('axios');

const BASE_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;

const whatsappAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Send a text message to a WhatsApp number
 */
const sendTextMessage = async (to, text) => {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  };
  const response = await whatsappAxios.post('/messages', payload);
  return response.data;
};

/**
 * Send a template message (e.g. hello_world)
 */
const sendTemplateMessage = async (to, templateName = 'hello_world', languageCode = 'en_US', components = []) => {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 && { components }),
    },
  };
  const response = await whatsappAxios.post('/messages', payload);
  return response.data;
};

/**
 * Mark a message as read
 */
const markAsRead = async (messageId) => {
  const payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  };
  const response = await whatsappAxios.post('/messages', payload);
  return response.data;
};

/**
 * Get media URL from media ID
 */
const getMediaUrl = async (mediaId) => {
  const response = await axios.get(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
  });
  return response.data.url;
};

module.exports = { sendTextMessage, sendTemplateMessage, markAsRead, getMediaUrl };
