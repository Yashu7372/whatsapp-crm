import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle, Download, Film, Image, Loader, Mic,
  RefreshCw, Search, Sparkles, TrendingUp, Upload,
} from 'lucide-react';
import {
  springApi,
  type MediaAsset,
  type ReelJob,
  type ReelTemplate,
  type StockMediaItem,
  type TrendSignal,
  type VideoScript,
} from '../services/springApi';

const panelStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 20,
  boxShadow: 'var(--shadow-sm)',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xs)',
  outline: 'none',
};

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 15px',
  border: 'none',
  borderRadius: 'var(--radius-xs)',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default function ContentStudio() {
  const [industry, setIndustry] = useState('Digital marketing');
  const [country, setCountry] = useState('AE');
  const [platformCode, setPlatformCode] = useState('INSTAGRAM');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('ENGAGING');
  const [durationSecs, setDurationSecs] = useState(30);
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [scripts, setScripts] = useState<VideoScript[]>([]);
  const [templates, setTemplates] = useState<ReelTemplate[]>([]);
  const [jobs, setJobs] = useState<ReelJob[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [stockItems, setStockItems] = useState<StockMediaItem[]>([]);
  const [stockQuery, setStockQuery] = useState('business product');
  const [stockInfo, setStockInfo] = useState('');
  const [selectedTrendId, setSelectedTrendId] = useState('');
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('DYNAMIC_BOLD');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [selectedAssetUrls, setSelectedAssetUrls] = useState<string[]>([]);
  const [includeVoice, setIncludeVoice] = useState(false);
  const [voice, setVoice] = useState('af_heart');
  const [busy, setBusy] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedScript = useMemo(
    () => scripts.find(script => script.id === selectedScriptId),
    [scripts, selectedScriptId],
  );

  const activeJobs = jobs.some(job => job.status === 'PENDING' || job.status === 'PROCESSING');

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (!activeJobs) return;
    const timer = window.setInterval(() => refreshJobs(false), 2500);
    return () => window.clearInterval(timer);
  }, [activeJobs]);

  async function loadInitial() {
    setBusy('loading');
    setError('');
    try {
      await springApi.authenticate();
      const [loadedScripts, loadedTemplates, loadedJobs, loadedMedia] = await Promise.all([
        springApi.listScripts(),
        springApi.listTemplates(),
        springApi.listReels(),
        springApi.listMedia(),
      ]);
      setScripts(loadedScripts);
      setTemplates(loadedTemplates);
      setJobs(loadedJobs);
      setMedia(loadedMedia.filter(asset => asset.contentType.startsWith('image/') || asset.contentType.startsWith('video/')));
      if (loadedScripts[0]) setSelectedScriptId(loadedScripts[0].id);
      if (loadedTemplates[0]) setSelectedTemplate(loadedTemplates[0].code);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy('');
    }
  }

  async function discoverTrends() {
    setBusy('trends');
    setError('');
    setNotice('');
    try {
      const result = await springApi.discoverTrends({ industry, country, platformCode, count: 6 });
      setTrends(result);
      if (result[0]) {
        setSelectedTrendId(result[0].id);
        setTopic(result[0].keyword || result[0].topic || '');
      }
      setNotice(result.length
        ? `Loaded ${result.length} trend signals.`
        : 'No live source responded. Check backend logs or generate a script from a manual topic.');
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy('');
    }
  }

  function chooseTrend(trend: TrendSignal) {
    setSelectedTrendId(trend.id);
    setTopic(trend.keyword || trend.topic || '');
  }

  async function generateScript() {
    if (!topic.trim()) {
      setError('Enter or select a topic first.');
      return;
    }
    setBusy('script');
    setError('');
    setNotice('');
    try {
      const generated = await springApi.generateScript({
        topic: topic.trim(),
        platformCode,
        contentType: 'REEL',
        style,
        durationSecs,
      });
      setScripts(previous => [generated, ...previous.filter(item => item.id !== generated.id)]);
      setSelectedScriptId(generated.id);
      setNotice('Gemma generated the reel script and shot list.');
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy('');
    }
  }

  async function uploadAsset(file?: File) {
    if (!file) return;
    setBusy('upload');
    setError('');
    try {
      const uploaded = await springApi.uploadMedia(file);
      setMedia(previous => [uploaded, ...previous]);
      setSelectedAssetIds(previous => [...new Set([...previous, uploaded.id])]);
      setNotice(`${uploaded.originalName} uploaded and selected.`);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy('');
    }
  }

  async function searchStock() {
    setBusy('stock');
    setError('');
    try {
      const result = await springApi.searchStock(stockQuery);
      setStockItems(result.items);
      if (!result.pexelsConfigured && !result.pixabayConfigured) {
        setStockInfo('No stock API key is configured. Add PEXELS_API_KEY or PIXABAY_API_KEY to .env, or render using text cards/uploaded media.');
      } else if (!result.items.length) {
        setStockInfo('The configured providers returned no matching media.');
      } else {
        setStockInfo(`${result.items.length} stock clips found.`);
      }
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy('');
    }
  }

  async function queueRender() {
    if (!selectedScriptId) {
      setError('Generate or select a script before rendering.');
      return;
    }
    setBusy('render');
    setError('');
    setNotice('');
    try {
      const job = await springApi.createReel({
        videoScriptId: selectedScriptId,
        templateCode: selectedTemplate,
        includeVoice,
        voice,
        assetIds: selectedAssetIds,
        assetUrls: selectedAssetUrls,
      });
      setJobs(previous => [job, ...previous.filter(item => item.id !== job.id)]);
      setNotice('Reel queued. The page will update automatically when FFmpeg finishes.');
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy('');
    }
  }

  async function refreshJobs(showBusy = true) {
    if (showBusy) setBusy('jobs');
    try {
      setJobs(await springApi.listReels());
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      if (showBusy) setBusy('');
    }
  }

  async function retryJob(id: string) {
    setBusy(`retry-${id}`);
    setError('');
    try {
      const retried = await springApi.retryReel(id);
      setJobs(previous => previous.map(job => job.id === retried.id ? retried : job));
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy('');
    }
  }

  function toggleValue(value: string, selected: string[], setSelected: (next: string[]) => void) {
    setSelected(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  }

  if (busy === 'loading') {
    return <CenteredMessage icon={<Loader size={22} className="spin" />} text="Connecting to the local Spring and Gemma stack…" />;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'var(--accent-glow)', color: 'var(--accent)' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.55rem' }}>AI Content Studio</h1>
              <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>
                Live signal → Gemma script → fixed template → local MP4 reel
              </p>
            </div>
          </div>
        </div>
        <button style={{ ...buttonStyle, background: 'var(--bg-card-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} onClick={() => loadInitial()}>
          <RefreshCw size={16} /> Reload
        </button>
      </div>

      {error && <Banner type="error" text={error} />}
      {notice && <Banner type="success" text={notice} />}

      <section style={panelStyle}>
        <SectionTitle number="1" icon={<TrendingUp size={19} />} title="Discover a content signal" />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <Field label="Industry"><input style={inputStyle} value={industry} onChange={event => setIndustry(event.target.value)} /></Field>
          <Field label="Country"><input style={inputStyle} value={country} onChange={event => setCountry(event.target.value)} placeholder="AE / IN" /></Field>
          <Field label="Platform">
            <select style={inputStyle} value={platformCode} onChange={event => setPlatformCode(event.target.value)}>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
              <option value="YOUTUBE">YouTube</option>
            </select>
          </Field>
          <button style={buttonStyle} disabled={busy === 'trends'} onClick={discoverTrends}>
            {busy === 'trends' ? <Loader size={16} /> : <Search size={16} />} Discover
          </button>
        </div>

        {trends.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginTop: 16 }}>
            {trends.map(trend => (
              <button key={trend.id} onClick={() => chooseTrend(trend)} style={{
                textAlign: 'left', padding: 14, borderRadius: 12, cursor: 'pointer',
                border: `1px solid ${selectedTrendId === trend.id ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedTrendId === trend.id ? 'var(--accent-glow)' : 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}>
                <strong>{trend.keyword || 'Trend signal'}</strong>
                <div style={{ color: 'var(--accent)', fontSize: '.78rem', marginTop: 5 }}>{trend.hashtag}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '.8rem', lineHeight: 1.45, margin: '9px 0 0' }}>{trend.topic}</p>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 8 }}>Score {Math.round((trend.finalScore || trend.rawScore) * 100)}%</div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <SectionTitle number="2" icon={<Sparkles size={19} />} title="Generate the Gemma reel script" />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px auto', gap: 12, alignItems: 'end' }}>
          <Field label="Topic"><input style={inputStyle} value={topic} onChange={event => setTopic(event.target.value)} placeholder="Enter a manual topic or select a signal" /></Field>
          <Field label="Tone">
            <select style={inputStyle} value={style} onChange={event => setStyle(event.target.value)}>
              <option value="ENGAGING">Engaging</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="EDUCATIONAL">Educational</option>
              <option value="HUMOROUS">Humorous</option>
              <option value="LUXURY">Luxury</option>
            </select>
          </Field>
          <Field label="Seconds"><input style={inputStyle} type="number" min={10} max={60} value={durationSecs} onChange={event => setDurationSecs(Number(event.target.value))} /></Field>
          <button style={buttonStyle} disabled={busy === 'script'} onClick={generateScript}>
            {busy === 'script' ? <Loader size={16} /> : <Sparkles size={16} />} Generate
          </button>
        </div>

        {scripts.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '.78rem', marginBottom: 6 }}>Selected script</label>
            <select style={inputStyle} value={selectedScriptId} onChange={event => setSelectedScriptId(event.target.value)}>
              {scripts.map(script => <option key={script.id} value={script.id}>{script.title} · {script.durationSecs}s</option>)}
            </select>
            {selectedScript && (
              <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedScript.hook || selectedScript.title}</strong>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55, margin: '8px 0 0' }}>{selectedScript.scriptBody}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <SectionTitle number="3" icon={<Film size={19} />} title="Choose template, media and voice" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {templates.map(template => (
            <button key={template.code} onClick={() => setSelectedTemplate(template.code)} style={{
              padding: 14, textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', borderRadius: 12,
              border: `1px solid ${selectedTemplate === template.code ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedTemplate === template.code ? 'var(--accent-glow)' : 'var(--bg-primary)',
            }}>
              <strong>{template.name}</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '.8rem', lineHeight: 1.45 }}>{template.description}</p>
              <span style={{ color: 'var(--accent)', fontSize: '.72rem' }}>{template.bestFor}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
          <div>
            <h3 style={{ fontSize: '.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><Upload size={17} /> Uploaded media</h3>
            <label style={{ ...buttonStyle, background: 'var(--bg-card-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', width: 'fit-content' }}>
              {busy === 'upload' ? <Loader size={15} /> : <Upload size={15} />} Upload image/video
              <input type="file" accept="image/*,video/*" hidden onChange={event => uploadAsset(event.target.files?.[0])} />
            </label>
            <div style={{ display: 'grid', gap: 8, marginTop: 10, maxHeight: 210, overflow: 'auto' }}>
              {media.length === 0 && <Empty text="No media uploaded. Text-card rendering still works." />}
              {media.map(asset => (
                <label key={asset.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedAssetIds.includes(asset.id)} onChange={() => toggleValue(asset.id, selectedAssetIds, setSelectedAssetIds)} />
                  {asset.contentType.startsWith('video/') ? <Film size={16} /> : <Image size={16} />}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.originalName}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><Search size={17} /> Stock video</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={inputStyle} value={stockQuery} onChange={event => setStockQuery(event.target.value)} />
              <button style={buttonStyle} onClick={searchStock} disabled={busy === 'stock'}>{busy === 'stock' ? <Loader size={15} /> : <Search size={15} />}</button>
            </div>
            {stockInfo && <p style={{ color: 'var(--text-muted)', fontSize: '.75rem', lineHeight: 1.4 }}>{stockInfo}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, maxHeight: 230, overflow: 'auto' }}>
              {stockItems.map(item => (
                <button key={`${item.provider}-${item.providerId}`} onClick={() => toggleValue(item.downloadUrl, selectedAssetUrls, setSelectedAssetUrls)} style={{
                  padding: 8, borderRadius: 10, cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
                  border: `1px solid ${selectedAssetUrls.includes(item.downloadUrl) ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedAssetUrls.includes(item.downloadUrl) ? 'var(--accent-glow)' : 'var(--bg-primary)',
                }}>
                  <div style={{ aspectRatio: '9/12', background: 'var(--bg-card-hover)', borderRadius: 7, overflow: 'hidden' }}>
                    {item.previewUrl
                      ? <img src={item.previewUrl} alt="Stock preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><Film size={24} /></div>}
                  </div>
                  <div style={{ fontSize: '.68rem', marginTop: 5 }}>{item.provider} · {item.creator}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'end', marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={includeVoice} onChange={event => setIncludeVoice(event.target.checked)} />
            <Mic size={17} /> Generate Kokoro voiceover
          </label>
          <Field label="Voice">
            <select style={{ ...inputStyle, minWidth: 160 }} value={voice} disabled={!includeVoice} onChange={event => setVoice(event.target.value)}>
              <option value="af_heart">af_heart</option>
              <option value="af_bella">af_bella</option>
              <option value="af_sky">af_sky</option>
              <option value="am_adam">am_adam</option>
            </select>
          </Field>
          <div style={{ flex: 1 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>{selectedAssetIds.length + selectedAssetUrls.length} media selected</div>
          <button style={{ ...buttonStyle, padding: '12px 22px' }} disabled={busy === 'render' || !selectedScriptId} onClick={queueRender}>
            {busy === 'render' ? <Loader size={17} /> : <Film size={17} />} Generate Reel
          </button>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle number="4" icon={<Film size={19} />} title="Render jobs" />
          <button style={{ ...buttonStyle, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={() => refreshJobs()}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {jobs.length === 0 && <Empty text="No reels have been rendered yet." />}
          {jobs.map(job => (
            <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: 13, border: '1px solid var(--border)', borderRadius: 12 }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{job.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '.74rem', marginTop: 4 }}>{job.templateCode} · attempt {job.attempts}</div>
                {job.errorMessage && <div style={{ color: 'var(--red)', fontSize: '.75rem', marginTop: 5 }}>{job.errorMessage}</div>}
              </div>
              <Status status={job.status} />
              <div style={{ display: 'flex', gap: 8 }}>
                {job.status === 'FAILED' && (
                  <button style={{ ...buttonStyle, padding: '8px 10px', background: 'var(--orange)' }} onClick={() => retryJob(job.id)} disabled={busy === `retry-${job.id}`}>
                    <RefreshCw size={15} /> Retry
                  </button>
                )}
                {job.status === 'COMPLETED' && (
                  <button style={{ ...buttonStyle, padding: '8px 10px' }} onClick={() => springApi.downloadReel(job.id, job.title)}>
                    <Download size={15} /> MP4
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ number, icon, title }: { number: string; icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 27, height: 27, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: '.75rem' }}>{number}</span>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6, color: 'var(--text-muted)', fontSize: '.75rem' }}>
      {label}
      {children}
    </label>
  );
}

function Banner({ type, text }: { type: 'error' | 'success'; text: string }) {
  const isError = type === 'error';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 10, border: `1px solid ${isError ? 'var(--red)' : 'var(--accent)'}`, background: isError ? 'var(--red-glow)' : 'var(--accent-glow)', color: isError ? 'var(--red)' : 'var(--accent)' }}>
      {isError ? <AlertCircle size={17} /> : <CheckCircle size={17} />} {text}
    </div>
  );
}

function Status({ status }: { status: ReelJob['status'] }) {
  const config = {
    PENDING: ['var(--orange)', 'Queued'],
    PROCESSING: ['var(--blue)', 'Rendering'],
    COMPLETED: ['var(--accent)', 'Ready'],
    FAILED: ['var(--red)', 'Failed'],
  }[status];
  return <span style={{ color: config[0], border: `1px solid ${config[0]}`, borderRadius: 999, padding: '5px 9px', fontSize: '.7rem', fontWeight: 700 }}>{config[1]}</span>;
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '.8rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10 }}>{text}</div>;
}

function CenteredMessage({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>{icon}{text}</div>;
}

function messageOf(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Unexpected Content Studio error';
}
