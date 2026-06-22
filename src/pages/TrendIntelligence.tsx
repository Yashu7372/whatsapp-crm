import { useEffect, useState } from 'react';
import { TrendingUp, Plus, X } from 'lucide-react';
import { trendApi } from '../api/trendApi';
import type { TrendSignal } from '../types/trend';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITTER', 'WHATSAPP', 'YOUTUBE'];

type SortKey = 'finalScore' | 'capturedAt';

function scoreColor(score: number) {
  if (score >= 0.7) return 'var(--accent)';
  if (score >= 0.4) return 'var(--yellow)';
  return 'var(--red)';
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      <div style={{
        height: '100%', borderRadius: 4, background: color,
        width: `${Math.min(value * 100, 100)}%`,
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TrendIntelligence() {
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('finalScore');
  const [showImport, setShowImport] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [platformCode, setPlatformCode] = useState('INSTAGRAM');
  const [rawScore, setRawScore] = useState(0.5);

  function load() {
    setLoading(true);
    setError(null);
    trendApi.listTrends()
      .then(setTrends)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await trendApi.importSignal({
        tenantId: DEMO_TENANT_ID,
        keyword, hashtag, topic, country, industry, platformCode, rawScore,
      });
      setKeyword(''); setHashtag(''); setTopic(''); setCountry(''); setIndustry('');
      setRawScore(0.5);
      setShowImport(false);
      load();
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...trends].sort((a, b) => {
    if (sortBy === 'finalScore') return (b.finalScore ?? 0) - (a.finalScore ?? 0);
    return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
  });

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Trend Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Discover trending topics, hashtags, and content opportunities across platforms
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <option value="finalScore">Sort by Score</option>
            <option value="capturedAt">Sort by Date</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowImport((v) => !v)}>
            {showImport ? <X size={15} /> : <Plus size={15} />}
            {showImport ? 'Cancel' : 'Import Signal'}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Import Trend Signal</h3>
          </div>
          <form onSubmit={handleImport}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Keyword</label>
                <input className="form-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="summer sale" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hashtag</label>
                <input className="form-input" value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="summerfashion" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Topic</label>
                <input className="form-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Fashion trends 2025" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Country</label>
                <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Industry</label>
                <input className="form-input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Retail" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Platform</label>
                <select className="form-select" value={platformCode} onChange={(e) => setPlatformCode(e.target.value)}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Raw Score: {rawScore.toFixed(2)}</label>
              <input
                type="range" min={0} max={1} step={0.01}
                value={rawScore} onChange={(e) => setRawScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Importing...' : 'Import Signal'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading trends...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--red)' }}>
          {error}
          <br />
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>Retry</button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><TrendingUp size={40} /></div>
          <h3>No trend signals yet</h3>
          <p>Import a trend signal manually or connect platforms to start collecting real-time trends</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {sorted.map((t) => {
            const label = t.keyword || t.hashtag || t.topic || 'Unnamed Trend';
            const color = scoreColor(t.finalScore ?? 0);
            return (
              <div key={t.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.keyword ? `#${t.keyword}` : t.hashtag ? `#${t.hashtag}` : label}
                    </p>
                    {t.topic && t.topic !== label && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.topic}</p>
                    )}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color, flexShrink: 0, marginLeft: 8 }}>
                    {((t.finalScore ?? 0) * 100).toFixed(0)}
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Final Score</span>
                    <span style={{ color }}>{((t.finalScore ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <ScoreBar value={t.finalScore ?? 0} color={color} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {t.platformCode && <span className="badge blue" style={{ fontSize: '0.72rem' }}>{t.platformCode}</span>}
                  {t.country && <span className="badge gray" style={{ fontSize: '0.72rem' }}>{t.country}</span>}
                  {t.industry && <span className="badge purple" style={{ fontSize: '0.72rem' }}>{t.industry}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Freshness', value: t.freshnessScore },
                    { label: 'Growth', value: t.growthScore },
                    { label: 'Relevance', value: t.relevanceScore },
                    { label: 'Safety', value: t.brandSafetyScore },
                  ].map((s) => (
                    <div key={s.label} style={{ fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 2 }}>
                        <span>{s.label}</span>
                        <span>{((s.value ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                      <ScoreBar value={s.value ?? 0} color="var(--blue)" />
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
                  {fmt(t.capturedAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
