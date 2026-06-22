import { TrendingUp, Hash, Flame, Globe, Zap } from 'lucide-react';

export default function TrendIntelligence() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Trend Intelligence</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Discover trending topics, hashtags, and content opportunities across platforms
        </p>
      </div>

      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <TrendingUp size={48} color="var(--accent)" />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Trend Intelligence — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          Connect your platforms to start collecting real-time trend signals. Once connected,
          this dashboard will surface trending topics, hashtags, and content opportunities
          ranked by relevance and brand safety.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '0.85rem',
        }}>
          <Zap size={16} />
          <span>Connect platforms under Connections to enable trend collection</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What Trend Intelligence will provide</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <Hash size={20} />, title: 'Hashtag Tracking', desc: 'Monitor trending hashtags by platform and region in real time' },
            { icon: <Flame size={20} />, title: 'Topic Signals', desc: 'Detect rising topics relevant to your industry and audience' },
            { icon: <Globe size={20} />, title: 'Cross-Platform View', desc: 'Aggregate trends from Instagram, LinkedIn, WhatsApp, and more' },
            { icon: <TrendingUp size={20} />, title: 'Scored Opportunities', desc: 'Each trend is scored for freshness, growth velocity, and brand safety' },
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
