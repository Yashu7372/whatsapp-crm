import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'data', 'crm.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_type TEXT DEFAULT 'other',
      whatsapp_number TEXT,
      whatsapp_phone_id TEXT,
      whatsapp_token TEXT,
      webhook_verify_token TEXT,
      plan TEXT DEFAULT 'starter',
      faq TEXT DEFAULT '[]',
      business_hours TEXT DEFAULT 'Sat-Thu 9am-9pm',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      wa_id TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      language TEXT DEFAULT 'en',
      tags TEXT DEFAULT '[]',
      car_details TEXT,
      vehicle_reg TEXT,
      last_service_date TEXT,
      last_seen_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
      UNIQUE(workspace_id, wa_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      status TEXT DEFAULT 'bot',
      assigned_to TEXT,
      last_message TEXT,
      last_message_at TEXT DEFAULT (datetime('now')),
      unread_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT,
      msg_type TEXT DEFAULT 'text',
      intent TEXT,
      confidence_score REAL,
      action_type TEXT,
      buttons TEXT,
      wa_message_id TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      service_type TEXT,
      scheduled_at TEXT,
      duration_mins INTEGER DEFAULT 30,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON contacts(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_wa_id ON contacts(wa_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
  `);

  // Migration: add new columns to existing databases
  const cols = db.prepare("PRAGMA table_info(contacts)").all() as any[];
  const colNames = cols.map((c: any) => c.name);
  if (!colNames.includes('car_details'))
    db.exec("ALTER TABLE contacts ADD COLUMN car_details TEXT");
  if (!colNames.includes('vehicle_reg'))
    db.exec("ALTER TABLE contacts ADD COLUMN vehicle_reg TEXT");
  if (!colNames.includes('last_service_date'))
    db.exec("ALTER TABLE contacts ADD COLUMN last_service_date TEXT");

  const msgCols = db.prepare("PRAGMA table_info(messages)").all() as any[];
  const msgColNames = msgCols.map((c: any) => c.name);
  if (!msgColNames.includes('action_type'))
    db.exec("ALTER TABLE messages ADD COLUMN action_type TEXT");
  if (!msgColNames.includes('buttons'))
    db.exec("ALTER TABLE messages ADD COLUMN buttons TEXT");

  // Seed a default workspace if none exists
  const count = db.prepare('SELECT COUNT(*) as c FROM workspaces').get() as any;
  if (count.c === 0) {
    db.prepare(`
      INSERT INTO workspaces (id, name, business_type, webhook_verify_token, faq)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuid(),
      'My Business',
      'other',
      'jeeva_crm_verify_' + Math.random().toString(36).slice(2, 10),
      JSON.stringify([
        { q: 'What are your timings?', a: 'We are open Sat–Thu, 9am–9pm' },
        { q: 'Where are you located?', a: 'Please contact us for location details' },
      ])
    );
  }
}

export function closeDb() {
  if (db) db.close();
}
