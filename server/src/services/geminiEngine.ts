import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ─── Types ──────────────────────────────────────────────────

export interface AiButton {
  id: string;
  text: string;
}

export interface AiResponse {
  reply: string;
  intent: string;
  confidence: number;
  actionType: 'EXISTING_CUSTOMER' | 'NEW_PROSPECT';
  buttons: AiButton[];
  metadataUsed: string[];
  extractedData: {
    name?: string;
    service?: string;
    preferredTime?: string;
    vehicleModel?: string;
    vehicleReg?: string;
  };
  shouldHandoff: boolean;
  language: string;
}

export interface UserMetadata {
  customer_name?: string;
  phone?: string;
  car_details?: {
    model: string;
    year?: string;
    registration?: string;
  } | null;
  vehicle_reg?: string;
  last_service_date?: string;
}

export interface ConversationContext {
  workspaceName: string;
  businessType: string;
  faq: { q: string; a: string }[];
  businessHours: string;
  recentMessages: { role: 'user' | 'assistant'; content: string }[];
  contactName?: string;
  userMetadata: UserMetadata;
}

// ─── Automotive System Prompt Builder ───────────────────────

function buildSystemPrompt(context: ConversationContext): string {
  const faqText = context.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
  const meta = context.userMetadata;

  const hasCarDetails = meta.car_details && meta.car_details.model;

  let segmentInstructions: string;

  if (hasCarDetails) {
    segmentInstructions = `
## SEGMENT A — EXISTING OWNER
The customer is an existing vehicle owner. Focus on RETENTION and SERVICE.
- Vehicle: ${meta.car_details!.model} ${meta.car_details!.year || ''}
- Registration: ${meta.vehicle_reg || meta.car_details!.registration || 'N/A'}
- Last Service: ${meta.last_service_date || 'Unknown'}
- Reference their vehicle model and last service date naturally in your response.
- You MUST include these mandatory buttons:
  {"id": "btn_book_service", "text": "Book Service"}
  {"id": "btn_view_history", "text": "View History"}
- You MAY add 1 extra contextual button (max 3 buttons total).
- Set action_type to "EXISTING_CUSTOMER".`;
  } else {
    segmentInstructions = `
## SEGMENT B — NEW PROSPECT
The customer is a new prospect (no car details on file). Focus on CONVERSION and LEAD GEN.
- You MUST include these mandatory buttons:
  {"id": "btn_test_drive", "text": "Book Test Drive"}
  {"id": "btn_brochure", "text": "Get Brochure"}
  {"id": "btn_sales", "text": "Speak to Sales"}
- Set action_type to "NEW_PROSPECT".`;
  }

  return `# System Instruction: Automotive AI Webhook Architect

You are the core logic engine for an Automotive WhatsApp Dashboard for "${context.workspaceName}".
You must process incoming user messages alongside user_context and return a structured JSON response.

## Business Info
- Type: ${context.businessType}
- Hours: ${context.businessHours}
${context.contactName ? `- Customer Name: ${context.contactName}` : ''}

## FAQ Knowledge Base
${faqText || 'No FAQ configured yet.'}

${segmentInstructions}

## Content Guidelines
- Tone: Professional yet conversational
- Variable Injection: Use customer_name, vehicle_reg, model to personalize reply_text
- Brevity: Max 3 sentences. Readable on one WhatsApp screen.
- Auto-detect and reply in the customer's language (English, Arabic, Hindi).
- If you cannot answer confidently, set should_handoff to true.

## user_context Payload
\`\`\`json
${JSON.stringify(meta, null, 2)}
\`\`\`

## Required JSON Response Schema (API Contract)
Respond with ONLY this JSON (no markdown, no code fences, raw JSON only):
{
  "reply_text": "Your concise, friendly message here.",
  "action_type": "EXISTING_CUSTOMER" or "NEW_PROSPECT",
  "intent": "INQUIRY|BOOKING_REQUEST|SERVICE_REQUEST|COMPLAINT|CONFIRMATION|GREETING|TEST_DRIVE|UNKNOWN",
  "confidence": 0.0-1.0,
  "buttons": [
    {"id": "btn_1", "text": "Button Text"}
  ],
  "metadata_used": ["list", "of", "variables", "injected"],
  "extracted_data": {
    "name": "",
    "service": "",
    "preferred_time": "",
    "vehicle_model": "",
    "vehicle_reg": ""
  },
  "should_handoff": false,
  "language": "en|ar|hi"
}`;
}

// ─── Main Function ──────────────────────────────────────────

export async function generateAiReply(
  customerMessage: string,
  context: ConversationContext
): Promise<AiResponse> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemPrompt = buildSystemPrompt(context);

  // Build conversation history
  const historyText = context.recentMessages
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = historyText
    ? `${systemPrompt}\n\nConversation history:\n${historyText}\n\nNew customer message: ${customerMessage}`
    : `${systemPrompt}\n\nCustomer message: ${customerMessage}`;

  const hasCarDetails = context.userMetadata.car_details?.model;

  // Default buttons based on segment
  const defaultButtons: AiButton[] = hasCarDetails
    ? [
        { id: 'btn_book_service', text: 'Book Service' },
        { id: 'btn_view_history', text: 'View History' },
      ]
    : [
        { id: 'btn_test_drive', text: 'Book Test Drive' },
        { id: 'btn_brochure', text: 'Get Brochure' },
        { id: 'btn_sales', text: 'Speak to Sales' },
      ];

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON from response, handling possible markdown wrapping
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);

    // Validate and ensure mandatory buttons are present
    let buttons: AiButton[] = Array.isArray(parsed.buttons) && parsed.buttons.length > 0
      ? parsed.buttons.map((b: any) => ({ id: b.id || `btn_${Math.random().toString(36).slice(2, 6)}`, text: b.text || '' }))
      : defaultButtons;

    // WhatsApp interactive buttons: max 3
    buttons = buttons.slice(0, 3);

    const actionType = parsed.action_type === 'EXISTING_CUSTOMER' ? 'EXISTING_CUSTOMER' : 'NEW_PROSPECT';

    console.log(`🚗 Automotive AI → ${actionType} | intent: ${parsed.intent} | buttons: [${buttons.map(b => b.text).join(', ')}]`);

    return {
      reply: parsed.reply_text || parsed.reply || "Thank you for reaching out! A team member will be with you shortly.",
      intent: parsed.intent || 'UNKNOWN',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      actionType,
      buttons,
      metadataUsed: Array.isArray(parsed.metadata_used) ? parsed.metadata_used : [],
      extractedData: {
        name: parsed.extracted_data?.name || undefined,
        service: parsed.extracted_data?.service || undefined,
        preferredTime: parsed.extracted_data?.preferred_time || undefined,
        vehicleModel: parsed.extracted_data?.vehicle_model || undefined,
        vehicleReg: parsed.extracted_data?.vehicle_reg || undefined,
      },
      shouldHandoff: parsed.should_handoff === true,
      language: parsed.language || 'en',
    };
  } catch (error) {
    console.error('Gemini AI error:', error);
    return {
      reply: "Thank you for your message! A team member will get back to you shortly. 😊",
      intent: 'UNKNOWN',
      confidence: 0,
      actionType: hasCarDetails ? 'EXISTING_CUSTOMER' : 'NEW_PROSPECT',
      buttons: defaultButtons,
      metadataUsed: [],
      extractedData: {},
      shouldHandoff: true,
      language: 'en',
    };
  }
}
