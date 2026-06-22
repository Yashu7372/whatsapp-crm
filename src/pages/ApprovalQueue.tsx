import { useEffect, useState } from 'react';
import { CheckSquare, ThumbsUp, ThumbsDown, Edit3, ClipboardList } from 'lucide-react';
import { approvalApi } from '../api/approvalApi';
import type { ApprovalTask } from '../types/approval';

const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES'] as const;
type Tab = typeof TABS[number];

const statusBadgeColor: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  NEEDS_CHANGES: 'yellow',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface ApprovalCardProps {
  task: ApprovalTask;
  onAction: () => void;
}

function ApprovalCard({ task, onAction }: ApprovalCardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [note, setNote] = useState('');

  async function doAction(action: 'approve' | 'reject' | 'requestChanges') {
    setActionLoading(action);
    try {
      if (action === 'approve') {
        await approvalApi.approve(task.id, { reviewedBy: 'Admin', note: '' });
      } else if (action === 'reject') {
        await approvalApi.reject(task.id, { reviewedBy: 'Admin', note });
        setShowRejectForm(false);
        setNote('');
      } else {
        await approvalApi.requestChanges(task.id, { reviewedBy: 'Admin', note });
        setShowChangesForm(false);
        setNote('');
      }
      onAction();
    } catch (err: any) {
      alert('Action failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  const isPending = task.status === 'PENDING';

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            Content Idea ID
          </p>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {task.contentIdeaId}
          </p>
        </div>
        <span className={`badge ${statusBadgeColor[task.status] ?? 'gray'}`}>{task.status}</span>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <span>Created: {fmt(task.createdAt)}</span>
        {task.reviewedAt && <span>Reviewed: {fmt(task.reviewedAt)}</span>}
        {task.reviewedBy && <span>By: {task.reviewedBy}</span>}
      </div>

      {task.reviewerNote && (
        <div style={{
          padding: '10px 14px', background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12,
        }}>
          <strong>Note:</strong> {task.reviewerNote}
        </div>
      )}

      {isPending && (
        <div>
          {!showRejectForm && !showChangesForm && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => doAction('approve')}
                disabled={actionLoading !== null}
              >
                <ThumbsUp size={14} />
                {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowChangesForm(true)}
              >
                <Edit3 size={14} /> Request Changes
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowRejectForm(true)}
              >
                <ThumbsDown size={14} /> Reject
              </button>
            </div>
          )}

          {(showRejectForm || showChangesForm) && (
            <div>
              <textarea
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={showRejectForm ? 'Reason for rejection...' : 'Describe the changes needed...'}
                rows={3}
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={showRejectForm ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                  onClick={() => doAction(showRejectForm ? 'reject' : 'requestChanges')}
                  disabled={actionLoading !== null}
                >
                  {actionLoading ? 'Submitting...' : showRejectForm ? 'Confirm Reject' : 'Send Request'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setShowRejectForm(false); setShowChangesForm(false); setNote(''); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalQueue() {
  const [tasks, setTasks] = useState<ApprovalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('PENDING');

  function load() {
    setLoading(true);
    setError(null);
    approvalApi.listAll()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = activeTab === 'ALL' ? tasks : tasks.filter((t) => t.status === activeTab);

  const pending = tasks.filter((t) => t.status === 'PENDING').length;
  const approved = tasks.filter((t) => t.status === 'APPROVED').length;
  const rejected = tasks.filter((t) => t.status === 'REJECTED').length;
  const changes = tasks.filter((t) => t.status === 'NEEDS_CHANGES').length;

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Approval Queue</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Review and approve AI-generated content before it goes live
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orange"><ClipboardList size={22} /></div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><ThumbsUp size={22} /></div>
          <div className="stat-value">{approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><ThumbsDown size={22} /></div>
          <div className="stat-value">{rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Edit3 size={22} /></div>
          <div className="stat-value">{changes}</div>
          <div className="stat-label">Needs Changes</div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ALL' ? 'All' : tab === 'NEEDS_CHANGES' ? 'Needs Changes' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading approval queue...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--red)' }}>
          {error}
          <br />
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CheckSquare size={36} /></div>
          <h3>No items in queue</h3>
          <p>
            {activeTab === 'PENDING'
              ? 'All content has been reviewed. Generate more content in Content Studio.'
              : `No ${activeTab.toLowerCase().replace('_', ' ')} items found.`}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((task) => (
            <ApprovalCard key={task.id} task={task} onAction={load} />
          ))}
        </div>
      )}
    </div>
  );
}
