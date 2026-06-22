import { useEffect, useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import { publishingApi, type ScheduleJobInput } from '../api/publishingApi';
import type { PublishJob } from '../types/publishing';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITTER', 'WHATSAPP', 'YOUTUBE'];

const statusBadge: Record<string, string> = {
  SCHEDULED: 'gray',
  RUNNING: 'blue',
  PUBLISHED: 'green',
  FAILED: 'red',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(jobs: PublishJob[]): Record<string, PublishJob[]> {
  const groups: Record<string, PublishJob[]> = {};
  for (const job of jobs) {
    const dateKey = new Date(job.scheduledAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(job);
  }
  return groups;
}

export default function ContentCalendar() {
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [contentIdeaId, setContentIdeaId] = useState('');
  const [platformAccountId, setPlatformAccountId] = useState('');
  const [platformCode, setPlatformCode] = useState('INSTAGRAM');
  const [scheduledAt, setScheduledAt] = useState('');
  const [contentSnapshot, setContentSnapshot] = useState('');

  function load() {
    setLoading(true);
    setError(null);
    publishingApi.listJobs()
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!contentIdeaId.trim() || !scheduledAt) return;
    setSubmitting(true);
    try {
      const input: ScheduleJobInput = {
        tenantId: DEMO_TENANT_ID,
        contentIdeaId: contentIdeaId.trim(),
        platformAccountId: platformAccountId.trim() || 'default',
        platformCode,
        scheduledAt: new Date(scheduledAt).toISOString(),
        contentSnapshot: contentSnapshot.trim(),
      };
      await publishingApi.scheduleJob(input);
      setContentIdeaId(''); setPlatformAccountId(''); setContentSnapshot(''); setScheduledAt('');
      setShowForm(false);
      load();
    } catch (err: any) {
      alert('Failed to schedule post: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const scheduled = jobs.filter((j) => j.status === 'SCHEDULED').length;
  const published = jobs.filter((j) => j.status === 'PUBLISHED').length;
  const failed = jobs.filter((j) => j.status === 'FAILED').length;

  const sorted = [...jobs].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const groups = groupByDate(sorted);
  const dateKeys = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Content Calendar</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Schedule and manage approved content across all platforms
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'Schedule Post'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Schedule a Post</h3>
          </div>
          <form onSubmit={handleSchedule}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Content Idea ID</label>
                <input
                  className="form-input"
                  value={contentIdeaId}
                  onChange={(e) => setContentIdeaId(e.target.value)}
                  placeholder="UUID of content idea"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Platform Account ID</label>
                <input
                  className="form-input"
                  value={platformAccountId}
                  onChange={(e) => setPlatformAccountId(e.target.value)}
                  placeholder="Platform account ID"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Platform</label>
                <select className="form-select" value={platformCode} onChange={(e) => setPlatformCode(e.target.value)}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Scheduled Date & Time</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Content Snapshot (optional)</label>
              <textarea
                className="form-input"
                value={contentSnapshot}
                onChange={(e) => setContentSnapshot(e.target.value)}
                placeholder="Paste the post content text here..."
                rows={3}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Post'}
            </button>
          </form>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><CalendarDays size={22} /></div>
          <div className="stat-value">{jobs.length}</div>
          <div className="stat-label">Total Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><CalendarDays size={22} /></div>
          <div className="stat-value">{scheduled}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CalendarDays size={22} /></div>
          <div className="stat-value">{published}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><CalendarDays size={22} /></div>
          <div className="stat-value">{failed}</div>
          <div className="stat-label">Failed</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading publish schedule...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--red)' }}>
          {error}
          <br />
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>Retry</button>
        </div>
      ) : dateKeys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CalendarDays size={40} /></div>
          <h3>No scheduled posts</h3>
          <p>Schedule your first post using the button above, or approve content in the Approval Queue</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <div style={{
                fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)',
                marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)',
              }}>
                {fmtDate(new Date(dateKey).toISOString())}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {groups[dateKey].map((job) => (
                  <div key={job.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ flexShrink: 0, width: 60, textAlign: 'right' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {fmtTime(job.scheduledAt)}
                      </span>
                    </div>
                    <div style={{ width: 1, height: 32, background: 'var(--border)', flexShrink: 0 }} />
                    <span className="badge blue" style={{ flexShrink: 0 }}>{job.platformCode}</span>
                    <span className={`badge ${statusBadge[job.status] ?? 'gray'}`} style={{ flexShrink: 0 }}>
                      {job.status}
                    </span>
                    <span style={{
                      flex: 1, fontSize: '0.82rem', color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      Idea: {job.contentIdeaId}
                    </span>
                    {job.contentSnapshot && (
                      <span style={{
                        flex: 2, fontSize: '0.82rem', color: 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {job.contentSnapshot}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
