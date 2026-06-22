import { Layers, Link2, KeyRound, Activity, ToggleRight } from 'lucide-react';

export default function PlatformIntegrations() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Platform Integrations</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Connect and manage your platform accounts (WhatsApp, Instagram, LinkedIn, etc.)
        </p>
      </div>

      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Layers size={48} color="var(--blue)" />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Platform Integrations — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          This is the central hub for all your platform connections. Connect new accounts,
          manage credentials, monitor connection health, and control which capabilities are
          active per platform.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--blue-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--blue)', fontSize: '0.85rem',
        }}>
          <Link2 size={16} />
          <span>Start by connecting your first platform to unlock intelligence features</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What Platform Integrations will provide</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <Link2 size={20} />, title: 'OAuth Connect', desc: 'Securely connect platform accounts via OAuth without storing raw credentials' },
            { icon: <KeyRound size={20} />, title: 'Credential Management', desc: 'View, refresh, and revoke platform credentials from one place' },
            { icon: <Activity size={20} />, title: 'Health Monitoring', desc: 'Real-time status for each connected account and webhook endpoint' },
            { icon: <ToggleRight size={20} />, title: 'Capability Control', desc: 'Enable or disable publishing, analytics, and lead collection per platform' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ color: 'var(--blue)', marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.88rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
