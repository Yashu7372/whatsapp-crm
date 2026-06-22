import { useEffect, useState } from 'react';
import { Link2, Trash2, Plus, X, CheckCircle } from 'lucide-react';
import { platformAccountApi, type PlatformAccount } from '../api/platformAccountApi';

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  INSTAGRAM:  { label: 'Instagram',  color: '#E1306C' },
  FACEBOOK:   { label: 'Facebook',   color: '#1877F2' },
  LINKEDIN:   { label: 'LinkedIn',   color: '#0A66C2' },
  TIKTOK:     { label: 'TikTok',     color: '#010101' },
  TWITTER:    { label: 'X / Twitter',color: '#1DA1F2' },
  YOUTUBE:    { label: 'YouTube',    color: '#FF0000' },
  WHATSAPP:   { label: 'WhatsApp',   color: '#25D366' },
};

const PLATFORMS = Object.keys(PLATFORM_META);

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PlatformIntegrations() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [platform, setPlatform] = useState('INSTAGRAM');
  const [accountName, setAccountName] = useState('');
  const [accountHandle, setAccountHandle] = useState('');

  function load() {
    setLoading(true);
    setError(null);
    platformAccountApi.list().then(setAccounts).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) return;
    setSubmitting(true);
    try {
      await platformAccountApi.addMock(platform, accountName.trim(), accountHandle.trim());
      setAccountName(''); setAccountHandle(''); setPlatform('INSTAGRAM');
      setShowForm(false);
      load();
    } catch (err: any) {
      alert('Failed to connect: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect(id: string, name: string) {
    if (!confirm(`Disconnect "${name}"?`)) return;
    try {
      await platformAccountApi.disconnect(id);
      load();
    } catch (err: any) {
      alert('Failed to disconnect: ' + err.message);
    }
  }

  const connectedCodes = new Set(accounts.map((a) => a.platformCode));

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Platform Integrations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Connect social media accounts to enable publishing, analytics, and lead collection
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Connect Account
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700 }}>Connect Platform Account</h3>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select className="form-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{PLATFORM_META[p].label}</option>
                ))}
              </select>
              <input className="form-input" placeholder="Account / page name *" value={accountName}
                onChange={(e) => setAccountName(e.target.value)} required />
              <input className="form-input" placeholder="Handle / username (e.g. @brand)" value={accountHandle}
                onChange={(e) => setAccountHandle(e.target.value)} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                In production, clicking Connect will redirect you through the platform's OAuth flow.
                For local testing, the account is added directly.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Connecting…' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
        {PLATFORMS.map((code) => {
          const meta = PLATFORM_META[code];
          const connected = connectedCodes.has(code);
          return (
            <div key={code} className="card" style={{
              borderLeft: `3px solid ${connected ? meta.color : 'var(--border)'}`,
              opacity: connected ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: meta.color + '22', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Link2 size={16} color={meta.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</div>
                  <div style={{ fontSize: '0.75rem', color: connected ? meta.color : 'var(--text-muted)', marginTop: 2 }}>
                    {connected ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={11} /> Connected
                      </span>
                    ) : 'Not connected'}
                  </div>
                </div>
                {!connected && (
                  <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={() => { setPlatform(code); setShowForm(true); }}>
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Connected Accounts</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {accounts.map((a) => {
              const meta = PLATFORM_META[a.platformCode] ?? { label: a.platformCode, color: 'var(--blue)' };
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6, background: meta.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Link2 size={14} color={meta.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.accountName || meta.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {a.accountHandle && `${a.accountHandle} · `}
                      {meta.label} · Connected {fmt(a.createdAt)}
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{ color: 'var(--red)', padding: '4px 8px' }}
                    onClick={() => handleDisconnect(a.id, a.accountName || meta.label)}
                    title="Disconnect">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <div className="empty-state">
          <Link2 size={36} color="var(--text-muted)" />
          <p>No platforms connected yet. Connect your first platform account to enable publishing and analytics.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Connect Platform</button>
        </div>
      )}
    </div>
  );
}
