import axios from 'axios';
import type { AiButton } from './geminiEngine';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

/**
 * Send a plain text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  recipientWaId: string,
  messageText: string
): Promise<string | null> {
  try {
    const response = await axios.post(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientWaId,
        type: 'text',
        text: { preview_url: false, body: messageText },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const waMessageId = response.data?.messages?.[0]?.id || null;
    console.log(`✅ WhatsApp text sent to ${recipientWaId}: ${waMessageId}`);
    return waMessageId;
  } catch (error: any) {
    console.error('❌ Failed to send WhatsApp message:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Send an interactive button message via WhatsApp Cloud API
 * WhatsApp supports up to 3 quick-reply buttons
 */
export async function sendWhatsAppButtonMessage(
  phoneNumberId: string,
  accessToken: string,
  recipientWaId: string,
  bodyText: string,
  buttons: AiButton[]
): Promise<string | null> {
  // WhatsApp max 3 buttons, each text max 20 chars
  const sanitizedButtons = buttons.slice(0, 3).map(btn => ({
    type: 'reply' as const,
    reply: {
      id: btn.id.slice(0, 256),
      title: btn.text.slice(0, 20),
    },
  }));

  try {
    const response = await axios.post(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientWaId,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: sanitizedButtons,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const waMessageId = response.data?.messages?.[0]?.id || null;
    console.log(`✅ WhatsApp buttons sent to ${recipientWaId}: [${buttons.map(b => b.text).join(', ')}] — ${waMessageId}`);
    return waMessageId;
  } catch (error: any) {
    console.error('❌ Failed to send button message:', error.response?.data || error.message);
    // Fallback: send as plain text with button labels inline
    console.log('↩️ Falling back to plain text...');
    const fallbackText = `${bodyText}\n\n${buttons.map((b, i) => `${i + 1}. ${b.text}`).join('\n')}`;
    return sendWhatsAppMessage(phoneNumberId, accessToken, recipientWaId, fallbackText);
  }
}

/**
 * Mark a message as read
 */
export async function markAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> {
  try {
    await axios.post(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to mark as read:', error.response?.data || error.message);
  }
}

/**
 * Parse incoming webhook payload from Meta
 * Handles both text messages AND interactive button replies
 */
export function parseWebhookMessage(body: any): ParsedMessage | null {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages?.[0]) return null;

    const msg = value.messages[0];
    const contact = value.contacts?.[0];
    const phoneNumberId = value.metadata?.phone_number_id;

    // Handle button reply (interactive)
    let text = '';
    let buttonId: string | null = null;

    if (msg.type === 'interactive' && msg.interactive?.button_reply) {
      text = msg.interactive.button_reply.title || '';
      buttonId = msg.interactive.button_reply.id || null;
    } else if (msg.type === 'text') {
      text = msg.text?.body || '';
    } else if (msg.type === 'button') {
      text = msg.button?.text || msg.button?.payload || '';
      buttonId = msg.button?.payload || null;
    }

    return {
      phoneNumberId,
      waId: msg.from,
      messageId: msg.id,
      timestamp: msg.timestamp,
      type: msg.type,
      text,
      buttonId,
      contactName: contact?.profile?.name || '',
      mediaUrl: msg.image?.id || msg.document?.id || msg.video?.id || null,
    };
  } catch (error) {
    console.error('Failed to parse webhook message:', error);
    return null;
  }
}

export interface ParsedMessage {
  phoneNumberId: string;
  waId: string;
  messageId: string;
  timestamp: string;
  type: string;
  text: string;
  buttonId: string | null;
  contactName: string;
  mediaUrl: string | null;
}
