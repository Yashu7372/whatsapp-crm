import { useEffect, useState } from 'react';
import { Wand2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { contentApi } from '../api/contentApi';
import type { ContentIdea, ContentVariant } from '../types/content';

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITTER', 'WHATSAPP'];
const CONTENT_TYPES = ['REEL', 'POST', 'STORY', 'CAROUSEL', 'ARTICLE', 'TEXT'];
const STATUS_TABS = ['ALL', 'GENERATED', 'REVIEW', 'APPROVED'] as const;

const platformBadgeColor: Record<string, string> = {
  INSTAGRAM: 'purple',
  FACEBOOK: 'blue',
  LINKEDIN: 'blue',
  TIKTOK: 'gray',
  TWITTER: 'blue',
  WHATSAPP: 'green',
};

const statusBadgeColor: Record<string, string> = {
  GENERATED: 'gray',
  REVIEW: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  NEEDS_CHANGES: 'yellow',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function IdeaRow({ idea }: { idea: ContentIdea }) {
  const [open, setOpen] = useState(false);
  const [variants, setVariants] = useState<ContentVariant[]>([]);
  const [loadingV, setLoadingV] = useState(false);
  const [errorV, setErrorV] = useState<string | null>(null);

  function toggle() {
    if (!open && variants.length === 0) {
      setLoadingV(true);
      setErrorV(null);
      contentApi.getVariants(idea.id)
        .then(setVariants)
        .catch((e) => setErrorV(e.message))
        .finally(() => setLoadingV(false));
    }
    setOpen((v) => !v);
  }

  return (
    <>
      <tr onClick={toggle} style={{ cursor: 'pointer' }}>
        <td>
          <span className={`badge ${platformBadgeColor[idea.platformCode] ?? 'gray'}`}>
            {idea.platformCode}
          </span>
        </td>
        <td>
          <span className="badge gray">{idea.contentType}</span>
        </td>
        <td>
          <span className={`badge ${statusBadgeColor[idea.status] ?? 'gray'}`}>{idea.status}</span>
        </td>
        <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {idea.topic}
        </td>
        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{fmt(idea.createdAt)}</td>
        <td style={{ color: 'var(--text-muted)' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
              {loadingV && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading variants...</p>}
              {errorV && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{errorV}</p>}
              {!loadingV && !errorV && variants.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No variants generated yet.</p>
              )}
              {variants.map((v) => (
                <div key={v.id} style={{
                  marginBottom: 16, padding: 16, background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Version {v.version}</span>
                    {v.callToAction && (
                      <span className="badge blue">{v.callToAction}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                    {v.body}
                  </p>
                  {v.hashtags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {v.hashtags.map((h) => (
                        <span key={h} className="badge purple" style={{ fontSize: '0.72rem' }}>#{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ContentStudio() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<typeof STATUS_TABS[number]>('ALL');

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [contentType, setContentType] = useState('POST');
  const [campaignId, setCampaignId] = useState('');
  const [generating, setGenerating] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    contentApi.listIdeas().then(setIdeas).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      await contentApi.generate({
        platformCode: platform,
        contentType,
        topic: topic.trim(),
        ...(campaignId.trim() ? { campaignId: campaignId.trim() } : {}),
      });
      setTopic('');
      load();
    } catch (err: any) {
      alert('Failed to generate content: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  const filtered = activeTab === 'ALL' ? ideas : ideas.filter((i) => i.status === activeTab);

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Content Studio</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Generate platform-specific content from trend signals using AI
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title">Generate Content</h3>
          <Sparkles size={18} color="var(--purple)" />
        </div>
        <form onSubmit={handleGenerate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Topic</label>
              <input
                className="form-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Summer sale discount 20%"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Platform</label>
              <select className="form-select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Content Type</label>
              <select className="form-select" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Campaign ID (optional)</label>
              <input
                className="form-input"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="Leave blank for standalone"
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={generating}>
            <Wand2 size={15} />
            {generating ? 'Generating...' : 'Generate Content'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Content Ideas</h3>
        </div>

        <div className="tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading content ideas...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--red)' }}>
            {error}
            <br />
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Wand2 size={36} /></div>
            <h3>No content ideas yet</h3>
            <p>Use the generator above to create your first AI-powered content idea</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Topic</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((idea) => <IdeaRow key={idea.id} idea={idea} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
