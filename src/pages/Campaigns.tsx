import { Plus, Send, Eye, MessageSquare, MousePointerClick, MoreVertical, Megaphone } from 'lucide-react';

const statusStyle: Record<string, string> = {
  draft: 'gray', scheduled: 'blue', sending: 'orange', sent: 'green', failed: 'red',
};

// Campaigns are Phase 2 (requires WhatsApp template approval from Meta)
// Showing empty state with explanation
export default function Campaigns() {
  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Broadcast Campaigns</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Send targeted WhatsApp campaigns with smart retargeting
          </p>
        </div>
        <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      {/* Coming Soon Banner */}
      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📢</div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Broadcast Campaigns — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          Campaign broadcasts require <strong>Meta-approved WhatsApp Message Templates</strong>.
          Get your templates approved in the Meta Business Manager, then campaigns will be unlocked here.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--blue-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--blue)', fontSize: '0.85rem',
        }}>
          <MessageSquare size={16} />
          <span>First connect WhatsApp and get template approval from Meta</span>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What campaigns will include</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <Send size={20} />, title: 'Broadcast Messages', desc: 'Send to your entire contact list or segments' },
            { icon: <Eye size={20} />, title: 'Read Receipts', desc: 'Track delivered, read, and replied rates' },
            { icon: <MousePointerClick size={20} />, title: 'Click Tracking', desc: 'See who clicked your call-to-action buttons' },
            { icon: <Megaphone size={20} />, title: 'Smart Retargeting', desc: 'Re-send to contacts who didn\'t reply or click' },
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
