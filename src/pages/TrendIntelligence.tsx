import { useEffect, useState } from 'react';
import { TrendingUp, Plus, X, Sparkles, Trash2, Lightbulb, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { trendApi, type DiscoverInput } from '../api/trendApi';
import type { TrendSignal } from '../types/trend';

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITTER', 'WHATSAPP', 'YOUTUBE'];
const INDUSTRIES = ['General', 'Retail', 'Fashion', 'Food & Beverage', 'Technology', 'Health & Fitness',
  'Beauty', 'Automotive', 'Real Estate', 'Finance', 'Education', 'Travel', 'Entertainment'];

function scoreColor(score: number) {
  if (score >= 0.7) return 'var(--accent)';
  if (score >= 0.4) return 'var(--yellow)';
  return 'var(--red)';
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', borderRadius: 4, background: color, width: `${Math.min(value * 100, 100)}%`, transition: 'width 0.5s ease' }} />
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface RecommendationPanelProps { id: string; }
function RecommendationPanel({ id }: RecommendationPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  async function load() {
    if (data) { setOpen(!open); return; }
    setLoading(true);
    setOpen(true);
    try {
      const raw = await trendApi.recommend(id);
      setData(typeof raw === 'string' ? JSON.parse(raw) : raw);
    } catch {
      setData({ summary: 'Could not load recommendations.', ideas: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={load} style={{
        display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
        color: 'var(--blue)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, fontWeight: 500,
      }}>
        <Lightbulb size={13} />
        {loading ? 'Getting AI ideas…' : open ? 'Hide recommendations' : 'AI content ideas'}
        {!loading && (open ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>
      {open && !loading && data && (
        <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem' }}>
          {data.summary && <p style={{ color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{data.summary}</p>}
          {data.ideas?.map((idea: any, i: number) => (
            <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: i < data.ideas.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontWeight: 600 }}>{idea.type}</span>
              {' — '}{idea.title}
              {idea.angle && <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{idea.angle}</div>}
            </div>
          ))}
          {data.bestTime && (
            <div style={{ marginTop: 6, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Best time: {data.bestTime}
            </div>
          )}
          {data.warning && (
            <div style={{ marginTop: 6, color: 'var(--yellow)', fontSize: '0.75rem' }}>⚠ {data.warning}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrendIntelligence() {
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'none' | 'import' | 'discover'>('none');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // import form
  const [keyword, setKeyword] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('');
  const [importIndustry, setImportIndustry] = useState('');
  const [platformCode, setPlatformCode] = useState('INSTAGRAM');
  const [rawScore, setRawScore] = useState(0.7);

  // discover form
  const [discIndustry, setDiscIndustry] = useState('General');
  const [discCountry, setDiscCountry] = useState('Global');
  const [discPlatform, setDiscPlatform] = useState('INSTAGRAM');
  const [discCount, setDiscCount] = useState(5);

  function load() {
    setLoading(true);
    setError(null);
    trendApi.listTrends().then(setTrends).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await trendApi.importSignal({ keyword, hashtag, topic, country, industry: importIndustry, platformCode, rawScore });
      setKeyword(''); setHashtag(''); setTopic(''); setCountry(''); setImportIndustry(''); setRawScore(0.7);
      setMode('none');
      load();
    } catch (err: any) { alert('Import failed: ' + err.message); }
    finally { setSubmitting(false); }
  }

  async function handleDiscover(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const input: DiscoverInput = { industry: discIndustry, country: discCountry, platformCode: discPlatform, count: discCount };
      const discovered = await trendApi.discover(input);
      setTrends((prev) => [...discovered, ...prev]);
      setMode('none');
    } catch (err: any) { alert('Discovery failed: ' + err.message); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try { await trendApi.delete(id); setTrends((prev) => prev.filter((t) => t.id !== id)); }
    catch (err: any) { alert('Delete failed: ' + err.message); }
    finally { setDeleting(null); }
  }

  const sorted = [...trends].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Trend Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            AI-powered trend discovery across social platforms — {sorted.length} signals
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setMode(mode === 'import' ? 'none' : 'import')}>
            <Plus size={14} /> Import
          </button>
          <button className="btn btn-primary" onClick={() => setMode(mode === 'discover' ? 'none' : 'discover')}>
            <Sparkles size={14} /> Discover with AI
          </button>
        </div>
      </div>

      {/* AI Discover Panel */}
      {mode === 'discover' && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--blue)', borderWidth: 1 }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--blue)" /> AI Trend Discovery
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: 14 }}>
            Gemini AI will discover trending topics for your industry and generate scored trend signals automatically.
          </p>
          <form onSubmit={handleDiscover}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="form-label">Industry</label>
                <select className="form-input" value={discIndustry} onChange={(e) => setDiscIndustry(e.target.value)}>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Country / Region</label>
                <input className="form-input" value={discCountry} onChange={(e) => setDiscCountry(e.target.value)} placeholder="Global, US, UAE…" />
              </div>
              <div>
                <label className="form-label">Platform</label>
                <select className="form-input" value={discPlatform} onChange={(e) => setDiscPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Count (max 10)</label>
                <input className="form-input" type="number" min={1} max={10} value={discCount} onChange={(e) => setDiscCount(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><Loader size={14} className="spin" /> Discovering…</> : <><Sparkles size={14} /> Discover {discCount} Trends</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setMode('none')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Import Panel */}
      {mode === 'import' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="card-title">Import Trend Signal</h3>
            <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => setMode('none')}><X size={16} /></button>
          </div>
          <form onSubmit={handleImport}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div><label className="form-label">Keyword</label><input className="form-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="summer sale" /></div>
              <div><label className="form-label">Hashtag</label><input className="form-input" value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="#summerfashion" /></div>
              <div><label className="form-label">Topic</label><input className="form-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Fashion trends 2025" /></div>
              <div><label className="form-label">Country</label><input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" /></div>
              <div><label className="form-label">Industry</label><input className="form-input" value={importIndustry} onChange={(e) => setImportIndustry(e.target.value)} placeholder="Retail" /></div>
              <div>
                <label className="form-label">Platform</label>
                <select className="form-input" value={platformCode} onChange={(e) => setPlatformCode(e.target.value)}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Raw Score: {rawScore.toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.01} value={rawScore}
                onChange={(e) => setRawScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Importing…' : 'Import'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setMode('none')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error} <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={load}>Retry</button></div>}

      {!loading && !error && sorted.length === 0 && (
        <div className="empty-state">
          <TrendingUp size={40} color="var(--text-muted)" />
          <p>No trends yet. Click <strong>Discover with AI</strong> to let Gemini find trending topics for your industry.</p>
          <button className="btn btn-primary" onClick={() => setMode('discover')}><Sparkles size={14} /> Discover with AI</button>
        </div>
      )}

      {sorted.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {sorted.map((t) => {
            const label = t.keyword || t.hashtag || t.topic || 'Trend';
            const color = scoreColor(t.finalScore ?? 0);
            return (
              <div key={t.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.93rem', marginBottom: 3 }}>
                      {t.keyword ? t.keyword : t.hashtag ? t.hashtag : label}
                    </p>
                    {t.topic && <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.topic.slice(0, 100)}{t.topic.length > 100 ? '…' : ''}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color }}>
                      {((t.finalScore ?? 0) * 100).toFixed(0)}
                    </span>
                    <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: 3 }}>
                    <span>Score</span><span style={{ color }}>{((t.finalScore ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <ScoreBar value={t.finalScore ?? 0} color={color} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {[
                    { label: 'Freshness', v: t.freshnessScore },
                    { label: 'Growth', v: t.growthScore },
                    { label: 'Relevance', v: t.relevanceScore },
                    { label: 'Safety', v: t.brandSafetyScore },
                  ].map((s) => (
                    <div key={s.label} style={{ fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 2 }}>
                        <span>{s.label}</span><span>{((s.v ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                      <ScoreBar value={s.v ?? 0} color="var(--blue)" />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {t.platformCode && <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.7rem', background: 'var(--blue-glow)', color: 'var(--blue)', fontWeight: 500 }}>{t.platformCode}</span>}
                  {t.country && <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.7rem', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>{t.country}</span>}
                  {t.industry && <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.7rem', background: 'var(--purple)22', color: 'var(--purple)', fontWeight: 500 }}>{t.industry}</span>}
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmt(t.capturedAt)}</span>
                </div>

                <RecommendationPanel id={t.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
