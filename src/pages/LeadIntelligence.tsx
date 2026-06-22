import { useEffect, useState } from 'react';
import { Target, TrendingUp, Star } from 'lucide-react';
import { leadApi } from '../api/leadApi';
import type { LeadSignal } from '../types/lead';

const intentBadgeColor: Record<string, string> = {
  PRICE_INQUIRY: 'yellow',
  BOOKING_REQUEST: 'green',
  DEMO_REQUEST: 'blue',
  COMPLAINT: 'red',
  SUPPORT_REQUEST: 'orange',
  SERVICE_REQUEST: 'purple',
  COMPETITOR_INTEREST: 'orange',
  GENERAL_QUESTION: 'gray',
};

function scoreColor(score: number) {
  if (score >= 0.7) return 'var(--accent)';
  if (score >= 0.4) return 'var(--yellow)';
  return 'var(--red)';
}

function ScoreBar({ value }: { value: number }) {
  const color = scoreColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, background: color,
          width: `${Math.min(value * 100, 100)}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function LeadIntelligence() {
  const [leads, setLeads] = useState<LeadSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    leadApi.listLeads()
      .then(setLeads)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const highIntent = leads.filter((l) => l.score >= 0.7).length;
  const avgScore = leads.length > 0
    ? (leads.reduce((s, l) => s + l.score, 0) / leads.length).toFixed(2)
    : '0.00';

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Lead Intelligence</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Track and score lead signals captured from all connected platforms
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Target size={22} /></div>
          <div className="stat-value">{leads.length}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Star size={22} /></div>
          <div className="stat-value">{highIntent}</div>
          <div className="stat-label">High Intent (&gt;70%)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><TrendingUp size={22} /></div>
          <div className="stat-value">{avgScore}</div>
          <div className="stat-label">Avg Score</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Lead Signals</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading leads...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--red)' }}>
            {error}
            <br />
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>Retry</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Target size={40} /></div>
            <h3>No lead signals yet</h3>
            <p>Connect platforms to start capturing and scoring lead signals from inbound interactions</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Intent</th>
                  <th>Score</th>
                  <th>Message Preview</th>
                  <th>Platform</th>
                  <th>Signal Type</th>
                  <th>Captured</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      {lead.intentCategory ? (
                        <span className={`badge ${intentBadgeColor[lead.intentCategory] ?? 'gray'}`}>
                          {lead.intentCategory.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <ScoreBar value={lead.score} />
                    </td>
                    <td style={{ maxWidth: 240 }}>
                      {lead.messageText ? (
                        <span style={{
                          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-secondary)',
                        }}>
                          {lead.messageText}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No message</span>
                      )}
                    </td>
                    <td>
                      <span className="badge blue">{lead.platformCode}</span>
                    </td>
                    <td>
                      <span className="badge gray">{lead.signalType.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {fmt(lead.capturedAt)}
                    </td>
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
