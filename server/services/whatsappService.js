import '../config/env.js';

const META_GRAPH_VERSION = 'v20.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Format phone number to E.164 digits only (no +)
 * e.g. +91 93449 14311 -> 919344914311
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Get Meta WhatsApp Business Account / Phone Number Details & Health Status
 */
export const getAccountDetails = async () => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      connected: false,
      error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing in environment',
    };
  }

  try {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        connected: false,
        error: data.error?.message || 'Failed to fetch Meta details',
        details: data.error,
        // Fallback: return the registered number from env
        registeredNumber: process.env.REGISTERED_NUMBER || '+919344914311',
        phoneNumberId,
      };
    }

    return {
      connected: true,
      data,
      phoneNumberId,
      appId: process.env.WHATSAPP_APP_ID,
      registeredNumber: process.env.REGISTERED_NUMBER || data.display_phone_number || '+919344914311',
      verifiedName: data.verified_name,
      qualityRating: data.quality_rating,
    };
  } catch (error) {
    console.error('[WhatsApp Service] getAccountDetails error:', error.message);
    return {
      connected: false,
      error: error.message,
      registeredNumber: process.env.REGISTERED_NUMBER || '+919344914311',
      phoneNumberId,
    };
  }
};

/**
 * Send text message via Meta WhatsApp Cloud API
 */
export const sendTextMessage = async (toPhone, messageText) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Meta WhatsApp credentials missing (WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID)');
  }

  const recipient = formatPhoneNumber(toPhone);
  if (!recipient) {
    throw new Error('Invalid recipient phone number');
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: false,
      body: messageText,
    },
  };

  try {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error(`[WhatsApp Service] Meta send error to ${recipient}:`, data.error);
      return {
        success: false,
        error: data.error?.message || 'Error sending message',
        details: data.error,
      };
    }

    console.log(`[WhatsApp Service] Message successfully sent to ${recipient}:`, data);
    return {
      success: true,
      data,
      waMessageId: data?.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('[WhatsApp Service] sendTextMessage error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send template message via Meta WhatsApp Cloud API
 */
export const sendTemplateMessage = async (toPhone, templateName = 'hello_world', languageCode = 'en_US', components = []) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Meta WhatsApp credentials missing');
  }

  const recipient = formatPhoneNumber(toPhone);
  if (!recipient) {
    throw new Error('Invalid recipient phone number');
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  try {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Error sending template',
        details: data.error,
      };
    }

    return {
      success: true,
      data,
      waMessageId: data?.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('[WhatsApp Service] sendTemplateMessage error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fetch approved WhatsApp message templates from Meta
 */
export const getTemplates = async () => {
  const token = process.env.WHATSAPP_TOKEN;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !wabaId) {
    return { success: false, error: 'WHATSAPP_TOKEN or WHATSAPP_BUSINESS_ACCOUNT_ID missing', templates: [] };
  }

  try {
    const url = `${GRAPH_BASE_URL}/${wabaId}/message_templates?fields=name,status,language,category,components&limit=50`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Failed to fetch templates',
        templates: [],
      };
    }

    return {
      success: true,
      templates: data.data || [],
    };
  } catch (error) {
    return { success: false, error: error.message, templates: [] };
  }
};

/**
 * Mark an incoming WhatsApp message as read
 */
export const markMessageAsRead = async (messageId) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || !messageId) return;

  try {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  } catch (error) {
    console.error('[WhatsApp Service] markMessageAsRead error:', error.message);
  }
};

/**
 * Upload header media (image, video, document) to WhatsApp Cloud API
 */
export const uploadMedia = async (buffer, mimeType = 'image/jpeg', filename = 'header_media') => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Meta WhatsApp credentials missing');
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, filename);
  formData.append('type', mimeType);
  formData.append('messaging_product', 'whatsapp');

  const url = `${GRAPH_BASE_URL}/${phoneNumberId}/media`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to upload media to WhatsApp Cloud API');
  }

  return {
    success: true,
    media_id: data.id,
  };
};

/**
 * Send Media Message (image, video, document) via WhatsApp Cloud API
 */
export const sendMediaMessage = async (toPhone, mediaType, mediaIdOrUrl, caption = '', filename = '') => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Meta WhatsApp credentials missing');
  }

  const recipient = formatPhoneNumber(toPhone);
  if (!recipient) {
    throw new Error('Invalid recipient phone number');
  }

  const mediaObj = {};
  if (String(mediaIdOrUrl).startsWith('http://') || String(mediaIdOrUrl).startsWith('https://')) {
    mediaObj.link = mediaIdOrUrl;
  } else {
    mediaObj.id = mediaIdOrUrl;
  }

  if (caption) {
    mediaObj.caption = caption;
  }
  if (mediaType === 'document' && filename) {
    mediaObj.filename = filename;
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: mediaType,
    [mediaType]: mediaObj,
  };

  try {
    const url = `${GRAPH_BASE_URL}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      console.error(`[WhatsApp Service] Meta sendMedia error to ${recipient}:`, data.error);
      return {
        success: false,
        error: data.error?.message || 'Error sending media',
        details: data.error,
      };
    }

    return {
      success: true,
      data,
      waMessageId: data?.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('[WhatsApp Service] sendMediaMessage error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};


