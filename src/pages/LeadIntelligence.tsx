import { Target, Star, Radio, GitMerge, TrendingUp } from 'lucide-react';

export default function LeadIntelligence() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Lead Intelligence</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Track and score lead signals captured from all connected platforms
        </p>
      </div>

      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Target size={48} color="var(--accent)" />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Lead Intelligence — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          Every inbound interaction across your connected platforms is evaluated as a potential
          lead signal. Leads are scored, ranked, and routed to your inbox or CRM automatically.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '0.85rem',
        }}>
          <Target size={16} />
          <span>Connect platforms to start capturing and scoring lead signals</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What Lead Intelligence will provide</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <Star size={20} />, title: 'Lead Scoring', desc: 'Every interaction is scored for intent, urgency, and conversion likelihood' },
            { icon: <Radio size={20} />, title: 'Signal Capture', desc: 'Detect lead signals from comments, messages, and profile interactions' },
            { icon: <GitMerge size={20} />, title: 'CRM Routing', desc: 'Automatically route high-score leads to your inbox or external CRM' },
            { icon: <TrendingUp size={20} />, title: 'Conversion Tracking', desc: 'Track which lead sources and signals actually convert to customers' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.88rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
