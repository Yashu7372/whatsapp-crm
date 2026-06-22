import { CalendarDays, MoveHorizontal, Clock, CheckCircle, LayoutGrid } from 'lucide-react';

export default function ContentCalendar() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Content Calendar</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Schedule and manage approved content across all platforms
        </p>
      </div>

      <div style={{
        padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <CalendarDays size={48} color="var(--orange)" />
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Content Calendar — Coming Soon</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.7 }}>
          Visualize and manage your entire content pipeline in a calendar view. Drag and reschedule
          posts, see publish times per platform, and track what went live.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: 'var(--orange-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--orange)', fontSize: '0.85rem',
        }}>
          <CalendarDays size={16} />
          <span>Approved content from the queue will populate here automatically</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">What the Content Calendar will provide</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <LayoutGrid size={20} />, title: 'Calendar View', desc: 'See all scheduled content in a monthly or weekly calendar layout' },
            { icon: <MoveHorizontal size={20} />, title: 'Drag & Reschedule', desc: 'Move posts to different dates and times with a simple drag gesture' },
            { icon: <Clock size={20} />, title: 'Platform Timelines', desc: 'View scheduled posts grouped by platform in a timeline format' },
            { icon: <CheckCircle size={20} />, title: 'Publish Tracking', desc: 'Track which posts went live, failed, or are still queued' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ color: 'var(--orange)', marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.88rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
