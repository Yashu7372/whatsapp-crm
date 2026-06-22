import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { exec } from 'child_process';

const router = Router();

let tunnelUrl: string | null = null;
let tunnelStatus: 'idle' | 'starting' | 'active' | 'error' = 'idle';
let tunnelError: string | null = null;
let tunnelProcess: any = null;

/**
 * GET /api/tunnel/status — returns current tunnel URL and status
 */
router.get('/status', (_req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT webhook_verify_token FROM workspaces LIMIT 1').get() as any;

  res.json({
    status: tunnelStatus,
    tunnelUrl,
    // Tunnel points to Spring Boot (/webhook), not the demo Express server
    webhookUrl: tunnelUrl ? `${tunnelUrl}/webhook` : null,
    error: tunnelError,
  });
});

/**
 * POST /api/tunnel/start — starts localtunnel to expose port 3001
 */
router.post('/start', (_req: Request, res: Response) => {
  if (tunnelStatus === 'active' && tunnelUrl) {
    return res.json({ success: true, tunnelUrl, webhookUrl: `${tunnelUrl}/webhook` });
  }

  tunnelStatus = 'starting';
  tunnelError = null;
  tunnelUrl = null;

  // Kill any existing tunnel
  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch {}
    tunnelProcess = null;
  }

  res.json({ success: true, message: 'Tunnel starting...' });

  // Start localhost.run via SSH
  const lt = exec('ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run -T 2>&1');
  tunnelProcess = lt;

  lt.stdout?.on('data', (data: string) => {
    // Look for: "tunneled with tls termination, https://..."
    const urlMatch = data.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.(life|net|run)/);
    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      tunnelStatus = 'active';
      console.log(`🌐 Tunnel active (localhost.run): ${tunnelUrl}/webhook`);
    }
  });

  lt.stderr?.on('data', (data: string) => {
    console.error('Tunnel log:', data);
    const urlMatch = data.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.(life|net|run)/);
    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      tunnelStatus = 'active';
      console.log(`🌐 Tunnel active (localhost.run): ${tunnelUrl}/webhook`);
    }
    if (!tunnelUrl && data.includes('Warning: Permanently added')) {
      // Ignorable ssh warning
    } else if (!tunnelUrl && data.includes('error')) {
      tunnelStatus = 'error';
      tunnelError = data.slice(0, 200);
    }
  });

  lt.on('close', (code: number) => {
    if (tunnelStatus !== 'error') {
      tunnelStatus = 'idle';
      tunnelUrl = null;
    }
    console.log('Tunnel process closed with code:', code);
  });
});

/**
 * POST /api/tunnel/stop — stops the tunnel
 */
router.post('/stop', (_req: Request, res: Response) => {
  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch {}
    tunnelProcess = null;
  }
  tunnelStatus = 'idle';
  tunnelUrl = null;
  tunnelError = null;
  res.json({ success: true });
});

export default router;
