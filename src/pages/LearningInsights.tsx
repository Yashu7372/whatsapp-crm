import { Brain, BarChart2, Users, Lightbulb, FileBarChart } from 'lucide-react';

export default function LearningInsights() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Learning Insights</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          AI-generated insights from content performance and lead patterns
        </p>
      </div>

      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Brain size={48} color="var(--purple)" />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Learning Insights — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          The AI continuously learns from your content performance and lead conversion patterns.
          Insights surface here as actionable recommendations to improve your strategy over time.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--purple-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--purple)', fontSize: '0.85rem',
        }}>
          <Brain size={16} />
          <span>Insights will appear as your content and lead data accumulates</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What Learning Insights will provide</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <BarChart2 size={20} />, title: 'Performance Patterns', desc: 'Identify which content types, formats, and times drive the most engagement' },
            { icon: <Users size={20} />, title: 'Lead Conversion Insights', desc: 'Understand which lead sources and journeys convert most reliably' },
            { icon: <Lightbulb size={20} />, title: 'Content Recommendations', desc: 'AI-generated suggestions for what to create next based on past results' },
            { icon: <FileBarChart size={20} />, title: 'Automated Reports', desc: 'Weekly and monthly insight digests delivered automatically' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ color: 'var(--purple)', marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.88rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
