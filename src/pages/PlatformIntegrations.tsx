import { useEffect, useState } from 'react';
import { Link2, Trash2, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { platformAccountApi, type PlatformAccount } from '../api/platformAccountApi';

const PLATFORM_META: Record<string, { label: string; color: string; oauthSupported: boolean }> = {
  INSTAGRAM: { label: 'Instagram',   color: '#E1306C', oauthSupported: true },
  TIKTOK:    { label: 'TikTok',      color: '#010101', oauthSupported: true },
  FACEBOOK:  { label: 'Facebook',    color: '#1877F2', oauthSupported: false },
  LINKEDIN:  { label: 'LinkedIn',    color: '#0A66C2', oauthSupported: false },
  TWITTER:   { label: 'X / Twitter', color: '#1DA1F2', oauthSupported: false },
  YOUTUBE:   { label: 'YouTube',     color: '#FF0000', oauthSupported: false },
  WHATSAPP:  { label: 'WhatsApp',    color: '#25D366', oauthSupported: false },
};

const OAUTH_PLATFORMS = Object.entries(PLATFORM_META)
  .filter(([, m]) => m.oauthSupported)
  .map(([code]) => code);

const ALL_PLATFORMS = Object.keys(PLATFORM_META);

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PlatformIntegrations() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    platformAccountApi.list()
      .then(setAccounts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleConnect(platformCode: string) {
    setConnecting(platformCode);
    setConnectError(null);
    try {
      const resp = await platformAccountApi.getOAuthUrl(platformCode);
      if (resp.error) {
        setConnectError(`${platformCode}: ${resp.error}`);
        return;
      }
      if (resp.oauthUrl) {
        // Redirect the current window to the OAuth provider
        window.location.href = resp.oauthUrl;
      }
    } catch (e: any) {
      setConnectError(e.message);
    } finally {
      setConnecting(null);
    }
  }

  async function handleDisconnect(id: string, name: string) {
    if (!confirm(`Disconnect "${name}"?`)) return;
    try {
      await platformAccountApi.disconnect(id);
      load();
    } catch (e: any) {
      alert('Failed to disconnect: ' + e.message);
    }
  }

  const connectedCodes = new Set(accounts.map((a) => a.platformCode));

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Platform Integrations</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          Connect your Instagram or TikTok account to enable direct publishing and real-time trend data.
        </p>
      </div>

      {connectError && (
        <div className="error-banner" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15} />
          {connectError}
          <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '2px 8px' }}
            onClick={() => setConnectError(null)}>Dismiss</button>
        </div>
      )}

      {/* OAuth-supported platforms (IG + TikTok) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Connect via OAuth Login
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {OAUTH_PLATFORMS.map((code) => {
            const meta = PLATFORM_META[code];
            const connected = connectedCodes.has(code);
            const acct = accounts.find((a) => a.platformCode === code);
            const isConnecting = connecting === code;

            return (
              <div key={code} className="card" style={{
                borderLeft: `3px solid ${connected ? meta.color : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: connected ? 12 : 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: meta.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Link2 size={18} color={meta.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{meta.label}</div>
                    <div style={{ fontSize: '0.75rem', color: connected ? meta.color : 'var(--text-muted)', marginTop: 2 }}>
                      {connected
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} /> Connected</span>
                        : 'Not connected'}
                    </div>
                  </div>
                </div>

                {connected && acct ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {acct.accountName}
                      {acct.accountHandle && <span style={{ color: 'var(--text-muted)' }}> · {acct.accountHandle}</span>}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Since {fmt(acct.createdAt)}</div>
                    </div>
                    <button className="btn btn-ghost" style={{ color: 'var(--red)', padding: '4px 8px' }}
                      onClick={() => handleDisconnect(acct.id, acct.accountName ?? meta.label)}
                      title="Disconnect">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 12, gap: 6 }}
                    disabled={isConnecting}
                    onClick={() => handleConnect(code)}
                  >
                    {isConnecting
                      ? 'Redirecting…'
                      : <><ExternalLink size={13} /> Login with {meta.label}</>}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 12, padding: '10px 14px', background: 'var(--bg-secondary)',
          borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong> Clicking "Login with Instagram/TikTok"
          redirects you to the platform's official login page. After you authorize,
          you're brought back here and your account is connected — no API keys needed on your end.
          <br />
          <strong style={{ color: 'var(--text-secondary)' }}>Requirements:</strong> Instagram requires a Business or Creator account
          linked to a Facebook Page. TikTok requires a standard account.
        </div>
      </div>

      {/* Other platforms */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Other Platforms (coming soon)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {ALL_PLATFORMS.filter((c) => !OAUTH_PLATFORMS.includes(c)).map((code) => {
            const meta = PLATFORM_META[code];
            const connected = connectedCodes.has(code);
            return (
              <div key={code} className="card" style={{
                borderLeft: `3px solid ${connected ? meta.color : 'var(--border)'}`,
                opacity: 0.6, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link2 size={14} color={meta.color} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{meta.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {connected ? '✓' : 'Soon'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading && <div className="loading-state" style={{ marginTop: 24 }}><div className="spinner" /></div>}
      {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

      {/* Connected accounts list */}
      {accounts.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
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
    </div>
  );
}
