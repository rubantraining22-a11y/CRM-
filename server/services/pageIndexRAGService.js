import { PageIndexClient } from '@pageindex/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import fs from 'fs';

// Initialize PageIndex Client with Vectorless Tree Engine
const getPageIndexClient = () => {
  const apiKey = process.env.PAGEINDEX_API_KEY || 'f76d0f2889e1436eb8ecd54065bf3aba';
  return new PageIndexClient({ apiKey });
};

// Initialize LangChain ChatOpenAI
const getLangChainChat = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-proj-invalid')) return null;
  try {
    return new ChatOpenAI({
      apiKey,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 500,
    });
  } catch (err) {
    console.warn('[LangChain] Failed to initialize ChatOpenAI:', err.message);
    return null;
  }
};

const SALES_ASSISTANT_SYSTEM_PROMPT = `You are a Senior Professional Sales Assistant & Automotive Consultant at TATA CAR PVT LTD (SGA Motors showroom).
Your mission is to assist customers on WhatsApp in a friendly, persuasive, and highly professional manner.

Key guidelines:
1. Tone: Polite, warm, expert, and customer-first. Use appropriate emojis (🚗, ✨, 📋, 🤝).
2. Format: Format answers cleanly for mobile/WhatsApp (short paragraphs, clear bullet points, under 150 words).
3. Objective: Answer the customer's question clearly, build trust, and gently invite them to take the next step (e.g. Schedule a showroom or doorstep Test Drive, request a detailed On-Road Quotation, or discuss exchange valuation).
4. Tata Vehicles: Knowledgeable about Tata Safari, Harrier, Curvv EV, Nexon, Punch, Altroz (safety rating, EV range, ADAS, features, on-road value).
5. If the question relates to documents, policies, or specific guidelines, prioritize official information.`;

// Intelligent fallback sales knowledge engine
const getSalesKnowledgeFallback = (query) => {
  const q = query.toLowerCase();

  if (q.includes('safari') || q.includes('harrier')) {
    return `🚗 *Tata Safari & Harrier Flagship SUVs*
• *Safety*: 5-Star Bharat-NCAP with Level 2 ADAS (11 Autonomous Features)
• *Engine*: 2.0L Kryotec Turbo Diesel (170 PS / 350 Nm) with 6-Speed Automatic/Manual
• *Luxury*: 12.3" Cinematic Touchscreen, Panoramic Sunroof with Mood Lighting, Ventilated Seats, JBL 10-Speaker Audio
• *Pricing*: Starting ₹ 15.49 Lakhs (Harrier) / ₹ 16.19 Lakhs (Safari) ex-showroom

Would you like me to book a doorstep Test Drive or send over the complete on-road price sheet for Coimbatore? 🤝`;
  }

  if (q.includes('nexon') || q.includes('curvv') || q.includes('punch')) {
    return `✨ *Tata Nexon & Curvv Coupe SUV*
• *Safety*: 5-Star Global/Bharat NCAP rating
• *Powertrain*: Turbo Petrol, Revotorq Diesel, and EV variants available
• *Tech*: 360° Surround Camera, Wireless Android Auto/Apple CarPlay, Ventilated Leatherette Seats
• *On-Road*: Starts ₹ 8.10 Lakhs (Nexon) / ₹ 17.49 Lakhs (Curvv EV 502 km range)

Shall I arrange a priority Test Drive slot for you this week? 📋`;
  }

  if (q.includes('test drive') || q.includes('book') || q.includes('slot')) {
    return `🎉 *Doorstep or Showroom Test Drive Booking*
We would be delighted to arrange a Test Drive at your preferred time and location (Home or Office)!

Could you please share:
1. Preferred Date & Time
2. Location / Address in Coimbatore
3. Specific Model & Variant (e.g., Safari Dark Edition, Curvv EV, Nexon)

Our Product Specialist will arrive with the sanitized vehicle! 🚗`;
  }

  if (q.includes('price') || q.includes('quote') || q.includes('discount') || q.includes('offer')) {
    return `📋 *Official Dealership Quotation & Festive Offers*
We have special festive exchange bonuses up to ₹ 45,000, corporate discounts, and attractive finance schemes starting at 8.45% ROI via Tata Motors Finance & SBI.

Which model and variant are you considering? I can generate an instant on-road quotation with tax breakdown for you! 🤝`;
  }

  return `Hello! Welcome to TATA CAR PVT LTD. I am your dedicated Sales Consultant. 🚗
How can I assist you today? We can help you with:
• Official On-Road Quotations & Brochures
• Doorstep Test Drive Scheduling
• Old Car Exchange Valuation
• Bank Finance & Delivery Timeline

Which Tata model are you exploring? 😊`;
};

/**
 * Get matching Tata vehicle document IDs from pageIndexDocs.json based on query
 */
const getMatchingTataDocIds = (userQuestion) => {
  try {
    const configPath = new URL('../config/pageIndexDocs.json', import.meta.url);
    if (fs.existsSync(configPath)) {
      const docs = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const q = String(userQuestion || '').toLowerCase();

      const matched = docs.filter((d) => {
        const name = d.name.toLowerCase();
        if (q.includes('altroz') && name.includes('altroz')) return true;
        if (q.includes('curvv') && name.includes('curvv')) return true;
        if (q.includes('harrier') && name.includes('harrier')) return true;
        if (q.includes('punch') && name.includes('punch')) return true;
        if (q.includes('nexon') && name.includes('nexon')) return true;
        if (q.includes('sierra') && name.includes('sierra')) return true;
        return false;
      });

      if (matched.length > 0) {
        return matched.map((m) => m.doc_id).filter(Boolean);
      }

      // Default: return flagship models
      return docs.slice(0, 4).map((m) => m.doc_id).filter(Boolean);
    }
  } catch (err) {
    console.warn('[PageIndex] Error reading doc mapping:', err.message);
  }
  return [];
};

/**
 * Main Vectorless RAG + LangChain Sales Assistant Query
 */
export const queryVectorlessRAG = async (userQuestion, conversationHistory = [], preferredDocId = null) => {
  const pageIndexClient = getPageIndexClient();
  const matchedDocs = getMatchingTataDocIds(userQuestion);
  const targetDocId = preferredDocId || (matchedDocs.length > 0 ? matchedDocs[0] : null) || process.env.PAGEINDEX_DEFAULT_DOC_ID;

  // ── Step 1: Query PageIndex Vectorless Reasoning Tree ──────────────────────
  if (targetDocId) {
    try {
      console.log(`[PageIndex RAG] Querying vectorless tree for doc_id: ${targetDocId}...`);
      const pageIndexRes = await pageIndexClient.api.chatCompletions({
        messages: [
          {
            role: 'system',
            content: `${SALES_ASSISTANT_SYSTEM_PROMPT}\nFirst analyze if the question is answerable from the document. If yes, synthesize the response accurately and professionally. If completely unrelated to the document, indicate that briefly.`,
          },
          ...conversationHistory.slice(-4).map((m) => ({
            role: m.sender === 'agent' ? 'assistant' : 'user',
            content: m.text,
          })),
          { role: 'user', content: userQuestion },
        ],
        doc_id: targetDocId,
      });

      const replyContent = pageIndexRes.choices?.[0]?.message?.content;
      if (replyContent && replyContent.trim().length > 10) {
        // Check if PageIndex found meaningful info
        const isIrrelevant = 
          replyContent.toLowerCase().includes('does not contain') &&
          replyContent.toLowerCase().includes('not mentioned in the document');

        if (!isIrrelevant) {
          console.log('[PageIndex RAG] Vectorless tree matched successfully!');
          return {
            reply: replyContent.trim(),
            source: 'pageindex_vectorless_rag',
            docId: targetDocId,
          };
        }
      }
    } catch (err) {
      console.warn('[PageIndex RAG] Vectorless query notice:', err.message);
    }
  }


  // ── Step 2: Query LangChain ChatOpenAI if PageIndex doc didn't cover it ─────
  const langChainChat = getLangChainChat();
  if (langChainChat) {
    try {
      console.log('[LangChain RAG] Consulting ChatOpenAI Sales Agent...');
      const messages = [
        new SystemMessage(SALES_ASSISTANT_SYSTEM_PROMPT),
        ...conversationHistory.slice(-4).map((m) =>
          m.sender === 'agent' ? new AIMessage(m.text) : new HumanMessage(m.text)
        ),
        new HumanMessage(userQuestion),
      ];

      const response = await langChainChat.invoke(messages);
      const answer = response.content;
      if (answer && answer.trim().length > 0) {
        return {
          reply: answer.trim(),
          source: 'langchain_openai',
        };
      }
    } catch (err) {
      console.warn('[LangChain RAG] LLM fallback notice:', err.message);
    }
  }

  // ── Step 3: Domain Sales Knowledge Engine (Ensures 100% Reliability) ───────
  console.log('[Sales Bot] Delivering response via Automotive Sales Engine...');
  const fallbackReply = getSalesKnowledgeFallback(userQuestion);
  return {
    reply: fallbackReply,
    source: 'sales_assistant_engine',
  };
};

/**
 * List documents indexed in PageIndex account
 */
export const listPageIndexDocs = async () => {
  try {
    const client = getPageIndexClient();
    const res = await client.api.listDocuments();
    return res.documents || [];
  } catch (err) {
    console.error('[PageIndex] listDocs error:', err.message);
    return [];
  }
};

/**
 * Upload a document to PageIndex
 */
export const uploadDocToPageIndex = async (fileBuffer, fileName) => {
  try {
    const client = getPageIndexClient();
    const res = await client.api.submitDocument(fileBuffer, fileName);
    return res;
  } catch (err) {
    console.error('[PageIndex] upload error:', err.message);
    throw err;
  }
};
