import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhook';
import apiRouter from './routes/api';
import tunnelRouter from './routes/tunnel';
import { getDb, closeDb } from './db/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Parse JSON — important: raw body needed for webhook signature verification
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/webhook', webhookRouter);
app.use('/api', apiRouter);
app.use('/api/tunnel', tunnelRouter);

// Initialize DB on startup
getDb();
console.log('📦 Database initialized');

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Jeeva CRM Server running on http://localhost:${PORT}`);
  console.log(`📡 WhatsApp webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`🔌 API base URL: http://localhost:${PORT}/api`);
  console.log(`\nTo expose publicly for Meta webhook, use:`);
  console.log(`  npx ngrok http ${PORT}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  closeDb();
  process.exit(0);
});
