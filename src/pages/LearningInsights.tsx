import { useEffect, useState } from 'react';
import { Brain, Lightbulb } from 'lucide-react';
import { analyticsApi } from '../api/analyticsApi';
import type { LearningInsight } from '../types/analytics';

const insightTypeBadge: Record<string, string> = {
  CONTENT_PERFORMANCE: 'blue',
  LEAD_CONVERSION: 'green',
  AUDIENCE_BEHAVIOUR: 'purple',
  BEST_TIME_TO_POST: 'orange',
  HASHTAG_PERFORMANCE: 'yellow',
  PLATFORM_COMPARISON: 'blue',
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.8 ? 'var(--accent)' : value >= 0.5 ? 'var(--blue)' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, background: color,
          width: `${Math.min(value * 100, 100)}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', color, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function LearningInsights() {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    analyticsApi.getInsights()
      .then(setInsights)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Learning Insights</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          AI-generated insights from content performance and lead patterns
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading insights...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--red)' }}>
          {error}
          <br />
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>Retry</button>
        </div>
      ) : insights.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <div className="empty-icon"><Brain size={40} /></div>
          <h3>No learning insights yet</h3>
          <p>
            Insights are generated automatically after content is published and analytics are ingested.
            Publish content and ingest analytics data to see AI-powered recommendations here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {insights.map((insight) => (
            <div key={insight.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{insight.title}</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${insightTypeBadge[insight.insightType] ?? 'gray'}`}>
                      {insight.insightType.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {fmt(insight.generatedAt)}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink: 0, width: 140 }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'right' }}>
                    Confidence
                  </p>
                  <ConfidenceBar value={insight.confidenceScore} />
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
                {insight.summary}
              </p>

              {insight.recommendation && (
                <div style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}>
                  <Lightbulb size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)', lineHeight: 1.6 }}>
                    {insight.recommendation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
