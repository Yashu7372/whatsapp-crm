import { useState, useEffect, useRef } from 'react';
import {
  Globe, Wifi, WifiOff, Copy, CheckCircle, ExternalLink,
  Play, Square, RefreshCw, AlertTriangle, Shield, Zap, ArrowRight,
  Terminal, Link
} from 'lucide-react';
import { http } from '../../api/httpClient';
import { tunnelApi, type TunnelState, type TunnelStatus } from '../../api/tunnelApi';

interface WebhookConfig {
  webhookPath: string;
  verifyToken: string;
  port: number;
}

export default function WebhookSetup() {
  const [tunnel, setTunnel] = useState<TunnelState>({
    status: 'idle', tunnelUrl: null, webhookUrl: null, error: null,
  });
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tunnelApi.getStatus().then(setTunnel).catch(console.error);
    // Verify token and webhook path come from Spring Boot
    http.get<WebhookConfig>('/webhook/config').then(setWebhookConfig).catch(console.error);
  }, []);

  useEffect(() => {
    if (tunnel.status === 'starting') {
      setPolling(true);
      pollRef.current = setInterval(async () => {
        const data = await tunnelApi.getStatus().catch(() => null);
        if (data) {
          setTunnel(data);
          if (data.status === 'active' || data.status === 'error' || data.status === 'idle') {
            clearInterval(pollRef.current!);
            setPolling(false);
          }
        }
      }, 1500);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tunnel.status]);

  const handleStart = async () => {
    setTunnel(t => ({ ...t, status: 'starting', error: null }));
    await tunnelApi.start().catch(console.error);
    // Polling will pick up the URL
  };

  const handleStop = async () => {
    await tunnelApi.stop().catch(console.error);
    setTunnel(t => ({ ...t, status: 'idle', tunnelUrl: null, webhookUrl: null }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
        color: copied === id ? 'var(--accent)' : 'var(--text-muted)',
        borderRadius: 4, transition: 'all var(--transition)',
        display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem',
      }}
    >
      {copied === id ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
    </button>
  );

  const isActive = tunnel.status === 'active';
  const isStarting = tunnel.status === 'starting';

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>WhatsApp Webhook Setup</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Generate a public webhook URL and connect it to Meta Developer Portal
        </p>
      </div>

      {/* How It Works */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(34,197,94,0.04), var(--bg-card))' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={17} color="var(--accent)" /> How WhatsApp Webhook Works
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { icon: '📱', label: 'Customer sends\nWhatsApp message' },
            { icon: '→', label: '' },
            { icon: '🌐', label: 'Meta Cloud API\nreceives it' },
            { icon: '→', label: '' },
            { icon: '🔗', label: 'POSTs to your\nwebhook URL' },
            { icon: '→', label: '' },
            { icon: '🤖', label: 'Gemini AI\nprocesses it' },
            { icon: '→', label: '' },
            { icon: '💬', label: 'Auto-reply\nsent back' },
          ].map((step, i) => (
            step.icon === '→'
              ? <ArrowRight key={i} size={16} color="var(--text-muted)" />
              : (
                <div key={i} style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{step.icon}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{step.label}</div>
                </div>
              )
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--blue-glow)', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', color: 'var(--blue)' }}>
          <strong>Key requirement:</strong> Meta needs to reach your server over the internet. Since you're running locally, we use a tunnel to create a public URL that forwards to <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 3 }}>localhost:8080/webhook</code> (Spring Boot)
        </div>
      </div>

      {/* Step 1: Tunnel */}
      <div className="card" style={{
        marginBottom: 20,
        borderColor: isActive ? 'rgba(34,197,94,0.3)' : isStarting ? 'rgba(59,130,246,0.3)' : 'var(--border)',
      }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#000', flexShrink: 0,
            }}>1</span>
            Generate Public Webhook URL
            {isActive && <span className="badge green"><Wifi size={11} /> Live</span>}
            {isStarting && <span className="badge blue"><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Starting...</span>}
          </h3>
          {isActive ? (
            <button className="btn btn-danger btn-sm" onClick={handleStop}><Square size={14} /> Stop Tunnel</button>
          ) : (
            <button className="btn btn-primary" onClick={handleStart} disabled={isStarting}>
              {isStarting ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Starting...</> : <><Play size={14} /> Start Tunnel</>}
            </button>
          )}
        </div>

        {tunnel.error && (
          <div style={{ padding: '10px 14px', background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-xs)', color: 'var(--red)', fontSize: '0.82rem', marginBottom: 12 }}>
            <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {tunnel.error}
          </div>
        )}

        {isStarting && !tunnel.tunnelUrl && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ marginBottom: 10, fontSize: '1.5rem' }}>⏳</div>
            Installing and starting tunnel... this takes ~10 seconds on first run
          </div>
        )}

        {isActive && tunnel.webhookUrl && (
          <div>
            <label className="form-label">Your Public Webhook URL</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-primary)', border: '2px solid var(--accent)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              marginBottom: 16,
            }}>
              <Link size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
              <code style={{ flex: 1, fontSize: '0.85rem', color: 'var(--accent)', wordBreak: 'break-all' }}>
                {tunnel.webhookUrl}
              </code>
              <CopyBtn text={tunnel.webhookUrl} id="webhook-url" />
            </div>
            <div style={{
              display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--accent-glow)',
              borderRadius: 'var(--radius-xs)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.8rem',
            }}>
              <CheckCircle size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Tunnel is active. Copy this URL and paste it into Meta Developer Portal below.</span>
            </div>
          </div>
        )}

        {tunnel.status === 'idle' && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Click <strong>Start Tunnel</strong> to generate a free public HTTPS URL using localhost.run (no account required).
          </p>
        )}
      </div>

      {/* Step 2: Verify Token */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>2</span>
            <Shield size={17} /> Your Webhook Verify Token
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Meta will send this token to verify your webhook is legitimate. Copy it exactly.
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
        }}>
          <Shield size={16} color="var(--blue)" style={{ flexShrink: 0 }} />
          <code style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.02em' }}>
            {webhookConfig?.verifyToken || 'Loading...'}
          </code>
          {webhookConfig?.verifyToken && <CopyBtn text={webhookConfig.verifyToken} id="verify-token" />}
        </div>
      </div>

      {/* Step 3: Meta Portal Instructions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>3</span>
            Configure in Meta Developer Portal
          </h3>
          <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} /> Open Meta Portal
          </a>
        </div>

        <ol style={{ paddingLeft: 20, lineHeight: 2.2, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <li>Go to your Meta App → <strong>WhatsApp</strong> → <strong>Configuration</strong></li>
          <li>Under <strong>Webhook</strong>, click <strong>Edit</strong></li>
          <li>
            Paste your <strong>Webhook URL</strong>:{' '}
            <code style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem', color: 'var(--accent)' }}>
              {tunnel.webhookUrl || '<start tunnel first>'}
            </code>
          </li>
          <li>
            Paste your <strong>Verify Token</strong>:{' '}
            <code style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem', color: 'var(--blue)' }}>
              {webhookConfig?.verifyToken || 'loading...'}
            </code>
          </li>
          <li>Click <strong>Verify and Save</strong> — Meta will send a GET request to your server ✅</li>
          <li>Under <strong>Webhook Fields</strong>, subscribe to: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4 }}>messages</code></li>
          <li>Under <strong>API Setup</strong>, copy your <strong>Phone Number ID</strong> and <strong>Access Token</strong></li>
          <li>Enter those in <strong>Settings → AI Bot Config</strong> and save</li>
        </ol>
      </div>

      {/* Step 4: Test */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>4</span>
            <Terminal size={17} /> Test the Integration
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '1️⃣', title: 'Verify webhook', desc: 'Click "Verify and Save" in Meta Portal — server should respond instantly' },
            { icon: '2️⃣', title: 'Send a WhatsApp message', desc: 'Message your WhatsApp Business number from any phone' },
            { icon: '3️⃣', title: 'Watch the AI reply', desc: 'Within seconds the Gemini bot will reply with segment-specific buttons' },
            { icon: '4️⃣', title: 'Check the Inbox', desc: 'The conversation appears in your dashboard Inbox in real-time' },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{step.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{step.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--yellow-glow)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', color: 'var(--yellow)' }}>
          <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          <strong>Important:</strong> The tunnel URL changes every time you restart it. You'll need to update Meta Portal whenever you restart the tunnel. For a permanent URL, deploy the server to Railway, Render, or a VPS.
        </div>
      </div>
    </div>
  );
}
