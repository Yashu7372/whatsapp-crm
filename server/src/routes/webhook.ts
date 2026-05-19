import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/database';
import { parseWebhookMessage, sendWhatsAppButtonMessage, sendWhatsAppMessage, markAsRead } from '../services/whatsapp';
import { generateAiReply } from '../services/geminiEngine';
import type { UserMetadata } from '../services/geminiEngine';

const router = Router();

/**
 * GET /webhook/whatsapp — Meta verification challenge
 */
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const db = getDb();
  const workspace = db.prepare('SELECT * FROM workspaces LIMIT 1').get() as any;

  if (mode === 'subscribe' && token === workspace?.webhook_verify_token) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed', { mode, token, expected: workspace?.webhook_verify_token });
    res.sendStatus(403);
  }
});

/**
 * POST /webhook/whatsapp — Receive incoming messages
 * Handles text messages AND interactive button replies
 */
router.post('/whatsapp', async (req: Request, res: Response) => {
  // Always respond 200 immediately to Meta (they retry on timeout)
  res.sendStatus(200);

  try {
    const parsed = parseWebhookMessage(req.body);
    if (!parsed || !parsed.text) return; // skip non-text or status updates

    const isButtonReply = !!parsed.buttonId;
    console.log(`📩 Incoming from ${parsed.waId}: "${parsed.text}"${isButtonReply ? ` [button: ${parsed.buttonId}]` : ''}`);

    const db = getDb();

    // ─── Resolve workspace ─────────────────────────────────
    let workspace = db.prepare(
      'SELECT * FROM workspaces WHERE whatsapp_phone_id = ?'
    ).get(parsed.phoneNumberId) as any;

    if (!workspace) {
      workspace = db.prepare('SELECT * FROM workspaces LIMIT 1').get() as any;
      if (!workspace) return;
      if (!workspace.whatsapp_phone_id) {
        db.prepare('UPDATE workspaces SET whatsapp_phone_id = ? WHERE id = ?')
          .run(parsed.phoneNumberId, workspace.id);
      }
    }

    if (!workspace.whatsapp_token) {
      console.log('⚠️ No WhatsApp token configured — cannot reply');
      return;
    }

    // ─── Upsert contact ────────────────────────────────────
    let contact = db.prepare(
      'SELECT * FROM contacts WHERE workspace_id = ? AND wa_id = ?'
    ).get(workspace.id, parsed.waId) as any;

    if (!contact) {
      const contactId = uuid();
      db.prepare(`
        INSERT INTO contacts (id, workspace_id, wa_id, name, phone, last_seen_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(contactId, workspace.id, parsed.waId, parsed.contactName || parsed.waId, parsed.waId);
      contact = { id: contactId, name: parsed.contactName || parsed.waId, car_details: null, vehicle_reg: null, last_service_date: null };
    } else {
      db.prepare(`
        UPDATE contacts SET name = COALESCE(?, name), last_seen_at = datetime('now') WHERE id = ?
      `).run(parsed.contactName || null, contact.id);
    }

    // ─── Find or create conversation ───────────────────────
    let conversation = db.prepare(`
      SELECT * FROM conversations WHERE workspace_id = ? AND contact_id = ? AND status != 'closed'
      ORDER BY created_at DESC LIMIT 1
    `).get(workspace.id, contact.id) as any;

    if (!conversation) {
      const convId = uuid();
      db.prepare(`
        INSERT INTO conversations (id, workspace_id, contact_id, status, last_message, last_message_at, unread_count)
        VALUES (?, ?, ?, 'bot', ?, datetime('now'), 1)
      `).run(convId, workspace.id, contact.id, parsed.text);
      conversation = { id: convId, status: 'bot' };
    } else {
      db.prepare(`
        UPDATE conversations SET last_message = ?, last_message_at = datetime('now'),
        unread_count = unread_count + 1 WHERE id = ?
      `).run(parsed.text, conversation.id);
    }

    // ─── Save inbound message ──────────────────────────────
    const inboundMsgId = uuid();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, direction, content, msg_type, wa_message_id, sent_at)
      VALUES (?, ?, 'inbound', ?, ?, ?, datetime('now'))
    `).run(inboundMsgId, conversation.id, parsed.text, parsed.type, parsed.messageId);

    // Mark as read on WhatsApp
    markAsRead(parsed.phoneNumberId, workspace.whatsapp_token, parsed.messageId);

    // If conversation is in 'human' mode, don't auto-reply
    if (conversation.status === 'human') {
      console.log('👤 Conversation in human mode — skipping AI reply');
      return;
    }

    // ─── Build user_metadata for Gemini ────────────────────
    let carDetails: UserMetadata['car_details'] = null;
    if (contact.car_details) {
      try { carDetails = JSON.parse(contact.car_details); } catch {}
    }

    const userMetadata: UserMetadata = {
      customer_name: contact.name || parsed.contactName || undefined,
      phone: contact.phone || parsed.waId,
      car_details: carDetails,
      vehicle_reg: contact.vehicle_reg || undefined,
      last_service_date: contact.last_service_date || undefined,
    };

    // ─── Get recent messages for context ───────────────────
    const recentMessages = db.prepare(`
      SELECT direction, content FROM messages
      WHERE conversation_id = ?
      ORDER BY sent_at DESC LIMIT 10
    `).all(conversation.id) as any[];

    const history = recentMessages.reverse().map((m: any) => ({
      role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));

    // ─── Generate AI reply ─────────────────────────────────
    const faq = JSON.parse(workspace.faq || '[]');
    const aiResponse = await generateAiReply(parsed.text, {
      workspaceName: workspace.name,
      businessType: workspace.business_type,
      faq,
      businessHours: workspace.business_hours || 'Sat-Thu 9am-9pm',
      recentMessages: history.slice(0, -1),
      contactName: contact.name,
      userMetadata,
    });

    console.log(`🤖 [${aiResponse.actionType}] AI reply (${aiResponse.intent}, ${Math.round(aiResponse.confidence * 100)}%): "${aiResponse.reply}"`);
    console.log(`   Buttons: [${aiResponse.buttons.map(b => b.text).join(', ')}]`);
    console.log(`   Metadata used: [${aiResponse.metadataUsed.join(', ')}]`);

    // ─── Flag for human review if needed ───────────────────
    if (aiResponse.shouldHandoff || aiResponse.confidence < 0.75) {
      db.prepare('UPDATE conversations SET status = ? WHERE id = ?')
        .run('human', conversation.id);
      console.log('⚠️ Low confidence — flagged for human review');
    }

    // ─── Update contact with extracted data ────────────────
    if (aiResponse.language) {
      db.prepare('UPDATE contacts SET language = ? WHERE id = ?').run(aiResponse.language, contact.id);
    }
    if (aiResponse.extractedData.vehicleModel && !contact.car_details) {
      const newCarDetails = JSON.stringify({ model: aiResponse.extractedData.vehicleModel, registration: aiResponse.extractedData.vehicleReg || '' });
      db.prepare('UPDATE contacts SET car_details = ? WHERE id = ?').run(newCarDetails, contact.id);
    }
    if (aiResponse.extractedData.vehicleReg && !contact.vehicle_reg) {
      db.prepare('UPDATE contacts SET vehicle_reg = ? WHERE id = ?').run(aiResponse.extractedData.vehicleReg, contact.id);
    }

    // ─── Save outbound message with buttons ────────────────
    const outboundMsgId = uuid();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, direction, content, msg_type, intent, confidence_score, action_type, buttons, sent_at)
      VALUES (?, ?, 'outbound', ?, 'interactive', ?, ?, ?, ?, datetime('now'))
    `).run(
      outboundMsgId,
      conversation.id,
      aiResponse.reply,
      aiResponse.intent,
      aiResponse.confidence,
      aiResponse.actionType,
      JSON.stringify(aiResponse.buttons)
    );

    // Update inbound message with detected intent
    db.prepare('UPDATE messages SET intent = ?, confidence_score = ? WHERE id = ?')
      .run(aiResponse.intent, aiResponse.confidence, inboundMsgId);

    // ─── Send via WhatsApp ─────────────────────────────────
    let waReplyId: string | null;

    if (aiResponse.buttons.length > 0) {
      // Send interactive button message
      waReplyId = await sendWhatsAppButtonMessage(
        parsed.phoneNumberId,
        workspace.whatsapp_token,
        parsed.waId,
        aiResponse.reply,
        aiResponse.buttons
      );
    } else {
      // Fallback to plain text
      waReplyId = await sendWhatsAppMessage(
        parsed.phoneNumberId,
        workspace.whatsapp_token,
        parsed.waId,
        aiResponse.reply
      );
    }

    if (waReplyId) {
      db.prepare('UPDATE messages SET wa_message_id = ? WHERE id = ?')
        .run(waReplyId, outboundMsgId);
    }

    // Update conversation
    db.prepare(`
      UPDATE conversations SET last_message = ?, last_message_at = datetime('now') WHERE id = ?
    `).run(aiResponse.reply, conversation.id);

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
  }
});

export default router;
