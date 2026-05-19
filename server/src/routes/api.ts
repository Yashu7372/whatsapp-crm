import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/database';
import { sendWhatsAppMessage } from '../services/whatsapp';
const router = Router();

// ─── Workspace ──────────────────────────────────────────
router.get('/workspace', (_req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT * FROM workspaces LIMIT 1').get() as any;
  if (!workspace) return res.status(404).json({ error: 'No workspace found' });

  res.json({
    ...workspace,
    faq: JSON.parse(workspace.faq || '[]'),
    // Don't expose the full token to frontend
    whatsapp_connected: !!workspace.whatsapp_token,
  });
});

router.put('/workspace', (req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT * FROM workspaces LIMIT 1').get() as any;
  if (!workspace) return res.status(404).json({ error: 'No workspace found' });

  const { name, business_type, business_hours, faq, whatsapp_phone_id, whatsapp_token, whatsapp_number } = req.body;

  db.prepare(`
    UPDATE workspaces SET
      name = COALESCE(?, name),
      business_type = COALESCE(?, business_type),
      business_hours = COALESCE(?, business_hours),
      faq = COALESCE(?, faq),
      whatsapp_phone_id = COALESCE(?, whatsapp_phone_id),
      whatsapp_token = COALESCE(?, whatsapp_token),
      whatsapp_number = COALESCE(?, whatsapp_number)
    WHERE id = ?
  `).run(
    name || null,
    business_type || null,
    business_hours || null,
    faq ? JSON.stringify(faq) : null,
    whatsapp_phone_id || null,
    whatsapp_token || null,
    whatsapp_number || null,
    workspace.id
  );

  const updated = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(workspace.id) as any;
  res.json({ ...updated, faq: JSON.parse(updated.faq || '[]'), whatsapp_connected: !!updated.whatsapp_token });
});

// ─── Dashboard Stats ────────────────────────────────────
router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT id FROM workspaces LIMIT 1').get() as any;
  if (!workspace) return res.json({});

  const today = new Date().toISOString().split('T')[0];

  const leadsToday = db.prepare(`
    SELECT COUNT(DISTINCT contact_id) as count FROM conversations
    WHERE workspace_id = ? AND date(created_at) = date(?)
  `).get(workspace.id, today) as any;

  const totalMessages = db.prepare(`
    SELECT COUNT(*) as count FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.workspace_id = ? AND m.direction = 'outbound'
  `).get(workspace.id) as any;

  const totalContacts = db.prepare(
    'SELECT COUNT(*) as count FROM contacts WHERE workspace_id = ?'
  ).get(workspace.id) as any;

  const totalBookings = db.prepare(
    'SELECT COUNT(*) as count FROM bookings WHERE workspace_id = ?'
  ).get(workspace.id) as any;

  res.json({
    leadsToday: leadsToday?.count || 0,
    messagesSent: totalMessages?.count || 0,
    totalContacts: totalContacts?.count || 0,
    totalBookings: totalBookings?.count || 0,
  });
});

// ─── Conversations ──────────────────────────────────────
router.get('/conversations', (_req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT id FROM workspaces LIMIT 1').get() as any;
  if (!workspace) return res.json([]);

  const conversations = db.prepare(`
    SELECT c.*, ct.name as contact_name, ct.phone as contact_phone,
           ct.wa_id, ct.language, ct.tags
    FROM conversations c
    JOIN contacts ct ON c.contact_id = ct.id
    WHERE c.workspace_id = ?
    ORDER BY c.last_message_at DESC
  `).all(workspace.id);

  res.json(conversations.map((c: any) => ({
    ...c,
    tags: JSON.parse(c.tags || '[]'),
  })));
});

// ─── Messages for a conversation ────────────────────────
router.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const db = getDb();
  const messages = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC
  `).all(req.params.id);
  res.json(messages);
});

// ─── Update conversation status (handoff) ───────────────
router.put('/conversations/:id/status', (req: Request, res: Response) => {
  const db = getDb();
  const { status } = req.body;
  if (!['bot', 'human', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE conversations SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// ─── Send manual message (agent reply) ──────────────────
router.post('/conversations/:id/send', async (req: Request, res: Response) => {
  const db = getDb();
  const { message } = req.body;

  const conv = db.prepare(`
    SELECT c.*, ct.wa_id, w.whatsapp_phone_id, w.whatsapp_token
    FROM conversations c
    JOIN contacts ct ON c.contact_id = ct.id
    JOIN workspaces w ON c.workspace_id = w.id
    WHERE c.id = ?
  `).get(req.params.id) as any;

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (!conv.whatsapp_token) return res.status(400).json({ error: 'WhatsApp not connected' });

  // Save message
  const msgId = uuid();
  db.prepare(`
    INSERT INTO messages (id, conversation_id, direction, content, msg_type, sent_at)
    VALUES (?, ?, 'outbound', ?, 'text', datetime('now'))
  `).run(msgId, conv.id, message);

  // Send via WhatsApp
  const waId = await sendWhatsAppMessage(conv.whatsapp_phone_id, conv.whatsapp_token, conv.wa_id, message);

  db.prepare('UPDATE conversations SET last_message = ?, last_message_at = datetime(\'now\') WHERE id = ?')
    .run(message, conv.id);

  res.json({ success: true, messageId: msgId, waMessageId: waId });
});

// ─── Contacts ───────────────────────────────────────────
router.get('/contacts', (_req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT id FROM workspaces LIMIT 1').get() as any;
  if (!workspace) return res.json([]);

  const contacts = db.prepare(`
    SELECT * FROM contacts WHERE workspace_id = ? ORDER BY last_seen_at DESC
  `).all(workspace.id);

  res.json(contacts.map((c: any) => ({ ...c, tags: JSON.parse(c.tags || '[]') })));
});

// ─── Bookings ───────────────────────────────────────────
router.get('/bookings', (_req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT id FROM workspaces LIMIT 1').get() as any;
  if (!workspace) return res.json([]);

  const bookings = db.prepare(`
    SELECT b.*, ct.name as contact_name, ct.phone as contact_phone
    FROM bookings b
    JOIN contacts ct ON b.contact_id = ct.id
    WHERE b.workspace_id = ?
    ORDER BY b.scheduled_at DESC
  `).all(workspace.id);

  res.json(bookings);
});

export default router;
