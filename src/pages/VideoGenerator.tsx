import { useEffect, useState } from 'react';
import { Film, Sparkles, Trash2, ChevronDown, ChevronUp, Music, Hash, Clock, Copy, Check, Layers, Share2 } from 'lucide-react';
import { videoApi, type VideoScript, type GenerateVideoInput, type VideoTemplateOption } from '../api/videoApi';

const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN', 'TWITTER', 'WHATSAPP'];
const CONTENT_TYPES = ['REEL', 'SHORT', 'STORY', 'POST', 'ARTICLE'];
const STYLES = ['ENGAGING', 'EDUCATIONAL', 'ENTERTAINING', 'INSPIRATIONAL', 'PROMOTIONAL', 'STORYTELLING', 'TUTORIAL', 'BEHIND_THE_SCENES'];
const DURATIONS = [15, 30, 60, 90, 120, 180, 300];

function parseShotList(raw: string): any[] {
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

function parseHashtags(raw: string): string[] {
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

const canShare = typeof navigator !== 'undefined' && !!navigator.share;

const SHARE_PLATFORMS = [
  {
    id: 'instagram', label: 'Instagram', color: '#E1306C', emoji: '📷',
    getUrl: (_: string) => 'https://www.instagram.com/',
    copyFirst: true,
    hint: 'Caption copied! Tap +, record or upload, then paste in the caption field.',
  },
  {
    id: 'tiktok', label: 'TikTok', color: '#FE2C55', emoji: '🎵',
    getUrl: (_: string) => 'https://www.tiktok.com/',
    copyFirst: true,
    hint: 'Caption copied! Tap +, upload your video, then paste in the description.',
  },
  {
    id: 'whatsapp', label: 'WhatsApp', color: '#25D366', emoji: '💬',
    getUrl: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
    copyFirst: false,
    hint: null,
  },
  {
    id: 'twitter', label: 'X', color: '#1DA1F2', emoji: '🐦',
    getUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 280))}`,
    copyFirst: false,
    hint: null,
  },
] as const;

function buildShareText(script: VideoScript, tags: string[]) {
  return [
    script.caption ?? script.title,
    '',
    tags.join(' '),
    script.musicSuggestion ? `\n🎵 ${script.musicSuggestion}` : '',
  ].join('\n').trim();
}

function buildFullText(script: VideoScript, tags: string[]) {
  return [
    `🎬 ${script.title}`,
    `Platform: ${script.platformCode} | Type: ${script.contentType} | Duration: ${script.durationSecs}s`,
    '',
    `HOOK: ${script.hook}`,
    '',
    `SCRIPT:\n${script.scriptBody}`,
    '',
    `CAPTION: ${script.caption}`,
    '',
    `HASHTAGS: ${tags.join(' ')}`,
    '',
    `MUSIC: ${script.musicSuggestion}`,
  ].join('\n');
}

function ScriptCard({ script, onDelete }: { script: VideoScript; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [platformToast, setPlatformToast] = useState<string | null>(null);
  const shots = parseShotList(script.shotList);
  const tags = parseHashtags(script.hashtags);

  async function handleShare() {
    const shareText = buildShareText(script, tags);
    if (canShare) {
      try {
        await navigator.share({ title: script.title, text: shareText });
      } catch {
        // user dismissed the sheet — no-op
      }
    } else {
      navigator.clipboard.writeText(buildFullText(script, tags)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  async function handlePlatformShare(platform: typeof SHARE_PLATFORMS[number]) {
    const shareText = buildShareText(script, tags);
    if (platform.copyFirst) {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        // clipboard may be unavailable on some browsers
      }
    }
    window.open(platform.getUrl(shareText), '_blank', 'noopener,noreferrer');
    if (platform.hint) {
      setPlatformToast(platform.hint);
      setTimeout(() => setPlatformToast(null), 5000);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.97rem', marginBottom: 4 }}>{script.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', background: 'var(--blue-glow)', color: 'var(--blue)', fontWeight: 600 }}>{script.platformCode}</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', background: 'var(--purple)22', color: 'var(--purple)' }}>{script.contentType}</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', background: 'var(--bg-primary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} />{script.durationSecs}s
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', background: 'var(--accent)22', color: 'var(--accent)' }}>{script.style}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleShare}
            className="btn btn-ghost"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            title={canShare ? 'Share to Instagram, TikTok…' : 'Copy script'}
          >
            {copied
              ? <Check size={14} color="var(--accent)" />
              : canShare
                ? <Share2 size={14} />
                : <Copy size={14} />}
          </button>
          <button onClick={onDelete} className="btn btn-ghost" style={{ padding: '5px 10px', color: 'var(--red)' }} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Hook */}
      {script.hook && (
        <div style={{ padding: '10px 14px', background: 'var(--accent)11', borderLeft: '3px solid var(--accent)', borderRadius: '0 6px 6px 0', marginBottom: 12, fontSize: '0.88rem', fontStyle: 'italic', fontWeight: 600 }}>
          🎣 Hook: "{script.hook}"
        </div>
      )}

      {/* Caption */}
      {script.caption && (
        <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', marginBottom: 12, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          📝 {script.caption}
        </div>
      )}

      {/* Expand toggle */}
      <button onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', padding: '4px 0', marginBottom: 8,
      }}>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Hide full script & shot list' : 'View full script & shot list'}
      </button>

      {expanded && (
        <>
          {/* Script body */}
          {script.scriptBody && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Voiceover / Script</div>
              <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                {script.scriptBody}
              </div>
            </div>
          )}

          {/* Shot list */}
          {shots.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Shot List ({shots.length} shots)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {shots.map((shot: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem' }}>
                    <span style={{ width: 22, height: 22, background: 'var(--blue-glow)', color: 'var(--blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                      {shot.id || i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-primary)', marginBottom: 2 }}>🎥 {shot.visual}</div>
                      {shot.audio && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>🔊 "{shot.audio}"</div>}
                    </div>
                    {shot.duration && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', flexShrink: 0 }}>{shot.duration}s</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer: hashtags + music */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 6 }}>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
            <Hash size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 3 }} />
            {tags.slice(0, 8).map((tag, i) => (
              <span key={i} style={{ fontSize: '0.72rem', color: 'var(--blue)', fontWeight: 500 }}>{tag}</span>
            ))}
            {tags.length > 8 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{tags.length - 8} more</span>}
          </div>
        )}
        {script.musicSuggestion && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            <Music size={11} /> {script.musicSuggestion}
          </span>
        )}
      </div>

      {/* Platform share grid */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SHARE_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handlePlatformShare(platform)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, padding: '10px 4px', borderRadius: 10, border: 'none',
                background: platform.color + '22', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = platform.color + '44')}
              onMouseLeave={(e) => (e.currentTarget.style.background = platform.color + '22')}
              title={platform.copyFirst ? `Copy caption & open ${platform.label}` : `Share to ${platform.label}`}
            >
              <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{platform.emoji}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: platform.color }}>{platform.label}</span>
            </button>
          ))}
        </div>
        {platformToast && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: 'var(--accent)22', border: '1px solid var(--accent)44',
            fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
          }}>
            {platformToast}
          </div>
        )}
        <button
          onClick={handleShare}
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 8, fontSize: '0.8rem', gap: 6 }}
        >
          {canShare
            ? <><Share2 size={13} /> More apps…</>
            : copied
              ? <><Check size={13} color="var(--accent)" /> Copied!</>
              : <><Copy size={13} /> Copy full script</>}
        </button>
      </div>
    </div>
  );
}

export default function VideoGenerator() {
  const [scripts, setScripts] = useState<VideoScript[]>([]);
  const [templates, setTemplates] = useState<VideoTemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [contentType, setContentType] = useState('REEL');
  const [style, setStyle] = useState('ENGAGING');
  const [duration, setDuration] = useState(30);
  const [template, setTemplate] = useState('PRODUCT_SHOWCASE');

  function load() {
    setLoading(true);
    videoApi.list().then(setScripts).catch(() => setScripts([])).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    videoApi.listTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const input: GenerateVideoInput = {
        topic: topic.trim(),
        platformCode: platform,
        contentType,
        style,
        durationSecs: duration,
        template,
      };
      const script = await videoApi.generate(input);
      setScripts((prev) => [script, ...prev]);
      setTopic('');
    } catch (err: any) {
      setError('Generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await videoApi.delete(id);
      setScripts((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Video Script Generator</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          AI-powered video scripts with hook, shot list, hashtags, and caption — ready to shoot
        </p>
      </div>

      {/* Generator Form */}
      <div className="card" style={{ marginBottom: 24, borderColor: 'var(--blue)', borderWidth: 1 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--blue)" /> Generate New Script
          </h3>
        </div>
        <form onSubmit={handleGenerate}>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Video Topic / Idea *</label>
            <input
              className="form-input"
              placeholder="e.g. 5 tips for summer skincare routine, Behind the scenes of our bakery, Product launch for our new app…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label">Platform</label>
              <select className="form-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Content Type</label>
              <select className="form-input" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                {CONTENT_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Style</label>
              <select className="form-input" value={style} onChange={(e) => setStyle(e.target.value)}>
                {STYLES.map((s) => <option key={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Duration</label>
              <select className="form-input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}s{d >= 60 ? ` (${d / 60}min)` : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Template selector */}
          {templates.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={13} /> Video Template
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                {templates.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setTemplate(t.code)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: template === t.code ? '2px solid var(--blue)' : '1px solid var(--border)',
                      background: template === t.code ? 'var(--blue-glow)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: template === t.code ? 'var(--blue)' : 'var(--text-primary)', marginBottom: 2 }}>
                      {t.displayName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {t.shotCount} shots
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={generating || !topic.trim()}
            style={{ minWidth: 180 }}>
            {generating
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating with AI…</>
              : <><Sparkles size={14} /> Generate Script</>}
          </button>
          {generating && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 10 }}>
              Gemini is writing your hook, script, shot list, and hashtags… (~10-20 seconds)
            </p>
          )}
        </form>
      </div>

      {/* Scripts list */}
      {loading && <div className="loading-state"><div className="spinner" /></div>}

      {!loading && scripts.length === 0 && !generating && (
        <div className="empty-state">
          <Film size={40} color="var(--text-muted)" />
          <p>No video scripts yet. Generate your first script above — AI will write a complete hook, voiceover, shot list, and hashtags.</p>
        </div>
      )}

      {scripts.length > 0 && (
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            {scripts.length} script{scripts.length !== 1 ? 's' : ''} generated
          </div>
          {scripts.map((s) => (
            <ScriptCard key={s.id} script={s} onDelete={() => handleDelete(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
