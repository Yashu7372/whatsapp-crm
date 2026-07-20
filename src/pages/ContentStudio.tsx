import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Clapperboard, Download, Film, Loader2, RefreshCw, Search,
  Sparkles, WandSparkles, CheckCircle2, AlertCircle, Play,
} from 'lucide-react';
import {
  studioApi, type RenderJob, type StockVideo, type TrendSignal,
  type VideoScript, type VideoTemplate,
} from '../services/studioApi';

const panelStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 20,
} as const;

export default function ContentStudio() {
  const [industry, setIndustry] = useState('Restaurants and local services');
  const [country, setCountry] = useState('AE');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('ENGAGING');
  const [duration, setDuration] = useState(30);
  const [brandName, setBrandName] = useState('Jeeva CRM');
  const [callToAction, setCallToAction] = useState('Message us on WhatsApp');
  const [voice, setVoice] = useState('af_heart');

  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [templateCode, setTemplateCode] = useState('PRODUCT_HOOK_V1');
  const [stockQuery, setStockQuery] = useState('business product lifestyle');
  const [stock, setStock] = useState<StockVideo[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [providers, setProviders] = useState<Array<{ code: string; name: string; available: boolean }>>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshJobs = useCallback(async () => {
    try {
      setJobs(await studioApi.getRenderJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load render jobs');
    }
  }, []);

  useEffect(() => {
    Promise.all([studioApi.getTemplates(), studioApi.getTrendProviders(), studioApi.getRenderJobs()])
      .then(([templateData, providerData, jobData]) => {
        setTemplates(templateData);
        setProviders(providerData);
        setJobs(jobData);
        if (templateData[0]) setTemplateCode(templateData[0].code);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    const active = jobs.some(job => job.status === 'QUEUED' || job.status === 'PROCESSING');
    if (!active) return;
    const timer = window.setInterval(refreshJobs, 3000);
    return () => window.clearInterval(timer);
  }, [jobs, refreshJobs]);

  const selectedTemplate = useMemo(
    () => templates.find(item => item.code === templateCode),
    [templates, templateCode],
  );

  async function discover() {
    setBusy('trends'); setError(''); setNotice('');
    try {
      const data = await studioApi.discoverTrends({ industry, country, platformCode: platform, count: 8 });
      setTrends(data);
      if (data.length === 0) setNotice('No provider returned results. Add a manual topic below and continue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trend discovery failed');
    } finally { setBusy(''); }
  }

  async function generateScript() {
    if (!topic.trim()) { setError('Select a trend or enter a topic first.'); return; }
    setBusy('script'); setError(''); setNotice('');
    try {
      const generated = await studioApi.generateScript({
        topic: topic.trim(), platformCode: platform, style, durationSecs: duration,
      });
      setScript(generated);
      setStockQuery(generated.title || topic);
      setNotice('Script generated locally. Review it before rendering.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Script generation failed');
    } finally { setBusy(''); }
  }

  async function searchStock() {
    setBusy('stock'); setError(''); setNotice('');
    try {
      const result = await studioApi.searchStock(stockQuery);
      setStock(result.items);
      setSelectedUrls([]);
      if (result.warnings?.length) setNotice(result.warnings.join(' '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stock video search failed');
    } finally { setBusy(''); }
  }

  function toggleStock(url: string) {
    setSelectedUrls(current => current.includes(url)
      ? current.filter(item => item !== url)
      : current.length < 4 ? [...current, url] : current);
  }

  async function queueRender() {
    if (!script) { setError('Generate a script before rendering.'); return; }
    setBusy('render'); setError(''); setNotice('');
    try {
      await studioApi.createRenderJob({
        scriptId: script.id,
        templateCode,
        assetUrls: selectedUrls,
        voice,
        brandName,
        callToAction,
      });
      setNotice('Render job queued. The page will refresh its status automatically.');
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not queue render');
    } finally { setBusy(''); }
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', fontWeight: 750 }}>
            <Clapperboard size={24} color="var(--accent)" /> AI Content Studio
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 5 }}>
            Discover topics, generate a Gemma 4 script and render a fixed-template 9:16 reel locally.
          </p>
        </div>
        <button className="btn" onClick={refreshJobs}><RefreshCw size={15} /> Refresh jobs</button>
      </div>

      {error && <Banner tone="error" text={error} />}
      {notice && <Banner tone="notice" text={notice} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(340px, .85fr)', gap: 18 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <section style={panelStyle}>
            <StepTitle number="1" title="Discover current topics" icon={<Sparkles size={18} />} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10 }}>
              <Input value={industry} onChange={setIndustry} placeholder="Industry" />
              <Input value={country} onChange={setCountry} placeholder="AE" />
              <select value={platform} onChange={event => setPlatform(event.target.value)} style={inputStyle}>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
              <button className="btn btn-primary" onClick={discover} disabled={busy === 'trends'}>
                {busy === 'trends' ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Discover
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sources: {providers.map(p => `${p.name} ${p.available ? '✓' : '(not configured)'}`).join(' · ') || 'loading'}
            </div>
            {trends.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
                {trends.slice(0, 8).map(trend => (
                  <button key={trend.id} onClick={() => setTopic(trend.topic || trend.keyword || '')} style={{
                    padding: 14, textAlign: 'left', background: topic === (trend.topic || trend.keyword) ? 'var(--blue-glow)' : 'var(--bg-primary)',
                    border: `1px solid ${topic === (trend.topic || trend.keyword) ? 'var(--blue)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer',
                  }}>
                    <div style={{ fontWeight: 650, fontSize: '0.86rem' }}>{trend.keyword || 'Trend'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 6, lineHeight: 1.45 }}>
                      {(trend.topic || '').slice(0, 150)}
                    </div>
                    <div style={{ color: 'var(--accent)', fontSize: '0.72rem', marginTop: 8 }}>{trend.hashtag}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <StepTitle number="2" title="Generate and review the script" icon={<WandSparkles size={18} />} />
            <textarea value={topic} onChange={event => setTopic(event.target.value)} placeholder="Select a trend or enter your own content topic" style={{ ...inputStyle, width: '100%', minHeight: 90, resize: 'vertical' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, marginTop: 10 }}>
              <select value={style} onChange={event => setStyle(event.target.value)} style={inputStyle}>
                <option value="ENGAGING">Engaging</option>
                <option value="EDUCATIONAL">Educational</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="PLAYFUL">Playful</option>
              </select>
              <select value={duration} onChange={event => setDuration(Number(event.target.value))} style={inputStyle}>
                <option value={15}>15 sec</option><option value={30}>30 sec</option><option value={45}>45 sec</option><option value={60}>60 sec</option>
              </select>
              <button className="btn btn-primary" onClick={generateScript} disabled={busy === 'script'}>
                {busy === 'script' ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Generate script
              </button>
            </div>
            {script && (
              <div style={{ marginTop: 15, padding: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700 }}>{script.title}</div>
                <div style={{ color: 'var(--accent)', marginTop: 8, fontSize: '0.86rem' }}>{script.hook}</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.82rem', whiteSpace: 'pre-wrap', marginTop: 10 }}>{script.scriptBody}</p>
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <StepTitle number="3" title="Choose visual assets" icon={<Film size={18} />} />
            <div style={{ display: 'flex', gap: 10 }}>
              <Input value={stockQuery} onChange={setStockQuery} placeholder="Search Pexels / Pixabay" />
              <button className="btn" onClick={searchStock} disabled={busy === 'stock'}>
                {busy === 'stock' ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Search
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Select up to four licensed stock clips. Rendering also works without clips using template backgrounds.
            </p>
            {stock.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
                {stock.map(item => {
                  const selected = selectedUrls.includes(item.downloadUrl);
                  return (
                    <button key={`${item.provider}-${item.providerId}`} onClick={() => toggleStock(item.downloadUrl)} style={{
                      position: 'relative', padding: 0, overflow: 'hidden', background: 'var(--bg-primary)',
                      border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    }}>
                      <img src={item.previewUrl} alt="Stock video preview" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: 8, color: 'var(--text-secondary)', fontSize: '0.7rem', textAlign: 'left' }}>
                        {item.provider} · {item.durationSeconds}s · {item.creatorName}
                      </div>
                      {selected && <CheckCircle2 size={22} color="var(--accent)" style={{ position: 'absolute', top: 8, right: 8 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <section style={panelStyle}>
            <StepTitle number="4" title="Template and brand" icon={<Play size={18} />} />
            <div style={{ display: 'grid', gap: 10 }}>
              {templates.map(template => (
                <button key={template.code} onClick={() => setTemplateCode(template.code)} style={{
                  padding: 13, textAlign: 'left', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: `1px solid ${templateCode === template.code ? 'var(--accent)' : 'var(--border)'}`,
                  background: templateCode === template.code ? 'var(--accent-glow)' : 'var(--bg-primary)', color: 'var(--text-primary)',
                }}>
                  <div style={{ fontWeight: 650, fontSize: '0.85rem' }}>{template.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: 4 }}>{template.description}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
              <Input value={brandName} onChange={setBrandName} placeholder="Brand name" />
              <Input value={callToAction} onChange={setCallToAction} placeholder="Call to action" />
              <select value={voice} onChange={event => setVoice(event.target.value)} style={inputStyle}>
                <option value="af_heart">English · Heart</option>
                <option value="af_bella">English · Bella</option>
                <option value="am_adam">English · Adam</option>
                <option value="am_michael">English · Michael</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={queueRender} disabled={!script || busy === 'render'} style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
              {busy === 'render' ? <Loader2 size={16} className="spin" /> : <Clapperboard size={16} />} Queue local render
            </button>
            {selectedTemplate && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 9 }}>Selected: {selectedTemplate.code}</div>}
          </section>

          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Render jobs</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{jobs.length} jobs</span>
            </div>
            <div style={{ display: 'grid', gap: 9 }}>
              {jobs.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No renders yet.</div>}
              {jobs.slice(0, 8).map(job => (
                <div key={job.id} style={{ padding: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 620, fontSize: '0.8rem' }}>
                      {job.status === 'COMPLETED' ? <CheckCircle2 size={16} color="var(--accent)" />
                        : job.status === 'FAILED' ? <AlertCircle size={16} color="var(--red)" />
                        : <Loader2 size={16} className="spin" color="var(--blue)" />}
                      {job.templateCode}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{job.status}</span>
                  </div>
                  {(job.status === 'PROCESSING' || job.status === 'QUEUED') && (
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 8, marginTop: 9, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(job.progress, job.status === 'QUEUED' ? 5 : 15)}%`, background: 'var(--blue)' }} />
                    </div>
                  )}
                  {job.errorMessage && <div style={{ color: 'var(--red)', fontSize: '0.72rem', marginTop: 7 }}>{job.errorMessage}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
                    {job.outputReady && (
                      <button className="btn" onClick={() => studioApi.downloadRenderJob(job.id)}><Download size={14} /> Download</button>
                    )}
                    {job.status === 'FAILED' && (
                      <button className="btn" onClick={async () => { await studioApi.retryRenderJob(job.id); await refreshJobs(); }}><RefreshCw size={14} /> Retry</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <style>{`.spin{animation:spin .85s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: '0.82rem',
} as const;

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />;
}

function StepTitle({ number, title, icon }: { number: string; title: string; icon: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#07120c', fontSize: '0.72rem', fontWeight: 800 }}>{number}</span>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</h3>
    </div>
  );
}

function Banner({ tone, text }: { tone: 'error' | 'notice'; text: string }) {
  return (
    <div style={{
      marginBottom: 14, padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
      border: `1px solid ${tone === 'error' ? 'var(--red)' : 'var(--blue)'}`,
      color: tone === 'error' ? 'var(--red)' : 'var(--blue)',
      background: tone === 'error' ? 'var(--red-glow)' : 'var(--blue-glow)',
    }}>{text}</div>
  );
}
