import { Wand2, Sparkles, Palette, FileText, FolderOpen } from 'lucide-react';

export default function ContentStudio() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Content Studio</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Generate platform-specific content from trend signals using AI
        </p>
      </div>

      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Wand2 size={48} color="var(--purple)" />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Content Studio — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          Turn trend signals into ready-to-publish content. Content Studio will use AI to generate
          platform-optimized posts, captions, and copy tailored to your brand voice.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--purple-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--purple)', fontSize: '0.85rem',
        }}>
          <Sparkles size={16} />
          <span>Enable Trend Intelligence first to power content generation</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What Content Studio will provide</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <Sparkles size={20} />, title: 'AI Content Generation', desc: 'Generate posts, captions, and copy from trend signals automatically' },
            { icon: <Palette size={20} />, title: 'Platform Adaptation', desc: 'Content is formatted and optimized for each target platform' },
            { icon: <Wand2 size={20} />, title: 'Brand Voice', desc: 'AI learns your tone and style to keep all output on-brand' },
            { icon: <FolderOpen size={20} />, title: 'Draft Management', desc: 'Save, edit, and organize generated drafts before sending to approval' },
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
