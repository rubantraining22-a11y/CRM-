import XLSX from 'xlsx';
import { getTemplates, sendTemplateMessage, uploadMedia } from '../services/whatsappService.js';
import Conversation from '../models/Conversation.js';
import { loadConversationsFromDB } from './chatController.js';

/**
 * Extract variable placeholders from a template's components
 * e.g. "Hello {{1}}, your car {{2}} is ready" -> ['1', '2']
 * or "Hello {{name}}, your car {{model}} is ready" -> ['name', 'model']
 */
export const extractTemplateVariables = (template) => {
  const vars = [];
  const bodyComp = template?.components?.find((c) => c.type === 'BODY');
  if (bodyComp?.text) {
    const matches = bodyComp.text.matchAll(/\{\{(\d+|[a-zA-Z0-9_]+)\}\}/g);
    for (const match of matches) {
      const varKey = match[1];
      if (!vars.includes(varKey)) {
        vars.push(varKey);
      }
    }
  }
  return vars;
};

/**
 * Match a template variable name against available CSV headers
 * Accepts: exact match, var_X, variable_X, or raw index
 */
const findHeaderIndex = (headers, varKey) => {
  const cleanKey = String(varKey).trim().toLowerCase();
  // Check exact
  let idx = headers.findIndex((h) => h === cleanKey);
  if (idx !== -1) return idx;

  // Check var_1, var1, variable_1
  idx = headers.findIndex((h) => h === `var_${cleanKey}` || h === `var${cleanKey}` || h === `variable_${cleanKey}`);
  if (idx !== -1) return idx;

  return -1;
};

/**
 * Check if a Meta API error is transient / retryable
 */
const isErrorRetryable = (errorMsg, details) => {
  if (!errorMsg && !details) return false;
  const msg = String(errorMsg || '').toLowerCase();
  const code = details?.code;
  // Hard non-retryable errors
  if (
    msg.includes('not a valid whatsapp user') ||
    msg.includes('invalid parameter') ||
    msg.includes('parameter format') ||
    msg.includes('template mismatch') ||
    msg.includes('does not exist') ||
    code === 100 ||
    code === 131026
  ) {
    return false;
  }
  // Transient / rate-limit errors
  if (
    msg.includes('rate') ||
    msg.includes('limit') ||
    msg.includes('timeout') ||
    msg.includes('temporar') ||
    code === 80007 ||
    code === 131048
  ) {
    return true;
  }
  return false;
};

/**
 * Log a bulk template message into the contact's conversation thread in DB & Socket
 */
export const logBulkMessageToInbox = async ({ phone, templateName, campaignId, waMessageId, io }) => {
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msgObj = {
    id: `tmpl-bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender: 'agent',
    text: `[Bulk Template: ${templateName}] (Campaign: ${campaignId})`,
    timestamp: timeStr,
    waMessageId,
    status: 'sent',
    isTemplate: true,
    isBulkSend: true,
    templateName,
    campaignId,
  };

  try {
    let conv = await Conversation.findOne({ phone: formattedPhone });
    if (conv) {
      conv.messages.push(msgObj);
      conv.lastMessage = msgObj.text;
      conv.lastMessageTime = 'Just now';
      await conv.save();
    } else {
      conv = await Conversation.create({
        id: `chat-${formattedPhone.replace(/\D/g, '')}`,
        phone: formattedPhone,
        name: `Contact (${formattedPhone})`,
        avatar: 'WA',
        unread: 0,
        online: true,
        lastMessage: msgObj.text,
        lastMessageTime: 'Just now',
        aiStatus: 'AI Sales Assistant Active',
        messages: [msgObj],
      });
    }

    // Reload cache
    await loadConversationsFromDB();

    // Broadcast to real-time live inbox
    if (io) {
      io.emit('whatsapp:incoming_message', {
        chatId: conv.id,
        message: msgObj,
        chat: conv,
      });
    }
  } catch (err) {
    console.error('[Bulk Campaign] Failed to log message to conversation DB:', err.message);
  }
};

/**
 * Upload header media to Meta Cloud API
 * POST /api/campaigns/upload-media
 */
export const uploadHeaderMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No media file uploaded' });
    }

    const result = await uploadMedia(
      req.file.buffer,
      req.file.mimetype || 'image/jpeg',
      req.file.originalname || 'header_media'
    );

    res.json({
      success: true,
      media_id: result.media_id,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error('[Campaign Controller] uploadHeaderMedia error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * WhatsApp Bulk Template Send (CSV Upload)
 * POST /campaigns/bulk-upload
 * POST /api/campaigns/bulk-upload
 */
export const bulkUploadCampaign = async (req, res) => {
  try {
    const { template_name, media_id, media_url } = req.body;

    // 1. File and template_name both present
    if (!req.file || !template_name || !String(template_name).trim()) {
      return res.status(400).json({
        success: false,
        error: 'file and template_name are both required.',
      });
    }

    const templateName = String(template_name).trim();

    // 2. template_name exists and is approved with your WhatsApp provider
    const templatesRes = await getTemplates();
    const templateList = templatesRes?.templates || [];
    const foundTemplate = templateList.find(
      (t) => t.name.toLowerCase() === templateName.toLowerCase() && t.status === 'APPROVED'
    );

    if (!foundTemplate) {
      return res.status(400).json({
        success: false,
        error: `Template '${templateName}' not found or not approved.`,
      });
    }

    // 3. Parse CSV with headers (columns: true). Reject empty CSV.
    let rawRows = [];
    try {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error: `Failed to parse CSV file: ${parseErr.message}`,
      });
    }

    if (!rawRows || rawRows.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'CSV file is empty or contains no records.',
      });
    }

    // Extract headers (normalized to lowercase)
    const rawHeaderRow = rawRows[0];
    const headerRow = rawHeaderRow.map((h) => String(h || '').trim().toLowerCase());

    // 4. Header row contains phone_number
    const phoneColIndex = headerRow.findIndex((h) => h === 'phone_number');
    if (phoneColIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Missing required column: phone_number',
      });
    }

    // 5. Header row contains every one of the template's variable placeholders by name
    const templateVars = extractTemplateVariables(foundTemplate);
    for (const v of templateVars) {
      const colIdx = findHeaderIndex(headerRow, v);
      if (colIdx === -1) {
        return res.status(400).json({
          success: false,
          error: `Missing required column: ${v}`,
        });
      }
    }

    // Check header media requirement
    const headerComp = foundTemplate.components?.find((c) => c.type === 'HEADER');
    const isMediaHeader = headerComp && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format?.toUpperCase());
    const headerMediaId = media_id || req.body.mediaId;
    const headerMediaUrl = media_url || req.body.mediaUrl;

    if (isMediaHeader && !headerMediaId && !headerMediaUrl) {
      return res.status(400).json({
        success: false,
        error: `Template '${templateName}' requires a header media file (${headerComp.format}). Upload media before proceeding.`,
      });
    }

    // Per-row processing (sequential, not parallel)
    const campaignId = `camp-${Date.now()}`;
    const rowsReport = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      // Skip empty row
      if (!row || row.every((c) => String(c).trim() === '')) continue;

      const rawPhone = String(row[phoneColIndex] || '').trim();

      // Normalize the phone number before anything else:
      // Strip all non-digits
      let normalizedPhone = rawPhone.replace(/\D/g, '');
      if (normalizedPhone.length === 10) {
        // 10 digits -> prepend country code 91 for India
        normalizedPhone = '91' + normalizedPhone;
      } else if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
        // 12 digits already starting with the country code -> use as-is
      } else if (normalizedPhone.length === 13 && normalizedPhone.startsWith('091')) {
        // 13 digits starting with a leading 0 + country code -> drop the leading 0
        normalizedPhone = normalizedPhone.slice(1);
      }
      // Anything else -> pass through as-is

      // If after normalization it's still under 10 digits, mark that row failed
      if (normalizedPhone.length < 10) {
        rowsReport.push({
          row_index: i + 1,
          phone_number: rawPhone,
          normalized_phone: normalizedPhone,
          status: 'failed',
          message_id: null,
          error: 'invalid phone number',
          timestamp: new Date().toISOString(),
        });
        totalFailed++;
        continue; // Don't waste a send attempt on garbage input
      }

      // Build the message payload
      const components = [];

      // Attach header media if applicable
      if (isMediaHeader && (headerMediaId || headerMediaUrl)) {
        const mediaType = headerComp.format.toLowerCase();
        const mediaParam = headerMediaId ? { id: headerMediaId } : { link: headerMediaUrl };
        components.push({
          type: 'header',
          parameters: [
            {
              type: mediaType,
              [mediaType]: mediaParam,
            },
          ],
        });
      }

      // Map each template variable, in order, to that row's matching CSV column value
      // Strip line breaks (\r/\n -> space) - WhatsApp templates reject multi-line variable values
      if (templateVars.length > 0) {
        const bodyParams = templateVars.map((v) => {
          const colIdx = findHeaderIndex(headerRow, v);
          const cellVal = colIdx !== -1 ? String(row[colIdx] || '') : '';
          const cleanedVal = cellVal.replace(/[\r\n]+/g, ' ').trim();
          return {
            type: 'text',
            text: cleanedVal || ' ',
          };
        });

        components.push({
          type: 'body',
          parameters: bodyParams,
        });
      }

      // Send with quick inline retry (cap at 2 total attempts inline)
      let sendResult = null;
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          sendResult = await sendTemplateMessage(
            normalizedPhone,
            foundTemplate.name,
            foundTemplate.language || 'en',
            components
          );

          if (sendResult?.success) {
            break; // Succeeded!
          }

          // Check if error is retryable
          const retryable = isErrorRetryable(sendResult?.error, sendResult?.details);
          if (retryable && attempts < maxAttempts) {
            console.log(`[Bulk Upload] Retryable error on row ${i + 1} (${normalizedPhone}). Waiting 2s before retry...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            break;
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            sendResult = { success: false, error: err.message };
            break;
          }
        }
      }

      if (sendResult?.success) {
        totalSent++;
        const waId = sendResult.waMessageId || sendResult.data?.messages?.[0]?.id || `wa-${Date.now()}`;
        rowsReport.push({
          row_index: i + 1,
          phone_number: rawPhone,
          normalized_phone: normalizedPhone,
          status: 'sent',
          message_id: waId,
          error: null,
          timestamp: new Date().toISOString(),
        });

        // Log into contact's conversation/inbox thread
        await logBulkMessageToInbox({
          phone: '+' + normalizedPhone,
          templateName: foundTemplate.name,
          campaignId,
          waMessageId: waId,
          io: req.io,
        });
      } else {
        totalFailed++;
        rowsReport.push({
          row_index: i + 1,
          phone_number: rawPhone,
          normalized_phone: normalizedPhone,
          status: 'failed',
          message_id: null,
          error: sendResult?.error || 'Send failed',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return res.json({
      success: true,
      campaignId,
      template_name: foundTemplate.name,
      total_rows: rowsReport.length,
      totalSent,
      totalFailed,
      rows: rowsReport,
    });
  } catch (error) {
    console.error('[Campaign Controller] bulkUploadCampaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
