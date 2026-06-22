import { CheckSquare, ThumbsUp, MessageCircle, Edit3, ClipboardList } from 'lucide-react';

export default function ApprovalQueue() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Approval Queue</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Review and approve AI-generated content before it goes live
        </p>
      </div>

      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <CheckSquare size={48} color="var(--blue)" />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Approval Queue — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          All AI-generated content passes through here before publishing. Review drafts,
          leave comments, request edits, or approve with one click.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--blue-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--blue)', fontSize: '0.85rem',
        }}>
          <CheckSquare size={16} />
          <span>Drafts from Content Studio will appear here for review</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What the Approval Queue will provide</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <ThumbsUp size={20} />, title: 'One-Click Approve', desc: 'Approve content instantly and push it straight to the calendar' },
            { icon: <MessageCircle size={20} />, title: 'Inline Comments', desc: 'Leave feedback directly on drafts for the AI to incorporate' },
            { icon: <Edit3 size={20} />, title: 'Edit Requests', desc: 'Request changes and have the AI regenerate refined versions' },
            { icon: <ClipboardList size={20} />, title: 'Audit Trail', desc: 'Full history of who reviewed, commented, and approved each piece' },
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
