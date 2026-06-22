import { useEffect, useState } from 'react';
import { Plus, Megaphone, CheckCircle, FileText, PauseCircle } from 'lucide-react';
import { campaignApi } from '../api/campaignApi';
import type { Campaign } from '../types/campaign';

const goalLabel: Record<string, string> = {
  AWARENESS: 'Awareness',
  LEADS: 'Leads',
  ENGAGEMENT: 'Engagement',
  TRAFFIC: 'Traffic',
};

const statusBadge: Record<string, string> = {
  ACTIVE: 'green',
  DRAFT: 'gray',
  PAUSED: 'orange',
  COMPLETED: 'blue',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('AWARENESS');
  const [brief, setBrief] = useState('');

  function load() {
    setLoading(true);
    setError(null);
    campaignApi.list().then(setCampaigns).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await campaignApi.create({ name: name.trim(), goal, brief });
      setName(''); setGoal('AWARENESS'); setBrief('');
      setShowForm(false);
      load();
    } catch (err: any) {
      alert('Failed to create campaign: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const total = campaigns.length;
  const active = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const draft = campaigns.filter((c) => c.status === 'DRAFT').length;
  const completed = campaigns.filter((c) => c.status === 'COMPLETED').length;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Campaigns</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage AI marketing campaigns across all connected platforms
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Create New Campaign</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Campaign Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Product Launch"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Goal</label>
              <select className="form-select" value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="AWARENESS">Awareness</option>
                <option value="LEADS">Leads</option>
                <option value="ENGAGEMENT">Engagement</option>
                <option value="TRAFFIC">Traffic</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brief</label>
              <textarea
                className="form-input"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe the campaign strategy, target audience, and key messages..."
                rows={4}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </form>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Megaphone size={22} /></div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={22} /></div>
          <div className="stat-value">{active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FileText size={22} /></div>
          <div className="stat-value">{draft}</div>
          <div className="stat-label">Draft</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><PauseCircle size={22} /></div>
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Campaigns</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading campaigns...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--red)' }}>
            {error}
            <br />
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>
              Retry
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Megaphone size={40} /></div>
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to get started with AI-powered marketing</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Goal</th>
                  <th>Status</th>
                  <th>Platforms</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className="badge gray">{goalLabel[c.goal] ?? c.goal}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge[c.status] ?? 'gray'}`}>{c.status}</span>
                    </td>
                    <td>
                      {c.platformCodes && c.platformCodes.length > 0
                        ? c.platformCodes.map((p) => (
                            <span key={p} className="badge blue" style={{ marginRight: 4 }}>{p}</span>
                          ))
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{fmt(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
