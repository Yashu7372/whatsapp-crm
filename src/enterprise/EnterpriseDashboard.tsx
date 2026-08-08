import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { enterpriseApi, type CommercialOverview, type Project } from './enterpriseApi';

const money = (value: number | undefined, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value ?? 0);

export default function EnterpriseDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [data, setData] = useState<CommercialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    enterpriseApi.projects().then(p => {
      setProjects(p);
      if (p.length) setProjectId(p[0].id);
    }).catch(e => setError(String(e))).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    enterpriseApi.commercialOverview(projectId, true)
      .then(d => { setData(d); setError(''); })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [projectId]);

  const load = () => projectId
    ? enterpriseApi.commercialOverview(projectId, true)
        .then(d => { setData(d); setError(''); })
        .catch(e => setError(String(e)))
        .finally(() => setLoading(false))
    : undefined;

  const riskClass = useMemo(() => data?.forecast.risk === 'HIGH' ? 'red' : data?.forecast.risk === 'MEDIUM' ? 'amber' : 'green', [data]);

  return <div className="ec-page">
    <header className="ec-topbar">
      <div className="ec-title"><h1>Project Control Overview</h1><p>Documents, IPC, budget exposure and SLA exceptions in one operational view.</p></div>
      <div className="ec-actions">
        <select className="ec-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}
        </select>
        <button className="ec-btn" onClick={load}><RefreshCw size={15}/> Refresh</button>
      </div>
    </header>
    {error && <div className="ec-error">{error}</div>}
    {loading && !data ? <div className="ec-loading">Loading authorized project information…</div> : data && <>
      <section className="ec-grid ec-kpis">
        <div className="ec-card"><div className="ec-kpi-label">Contract value</div><div className="ec-kpi-value">{money(data.contractValue,data.currency)}</div><div className="ec-kpi-meta">Commercial baseline</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Certified IPC</div><div className="ec-kpi-value">{money(data.certifiedIpc,data.currency)}</div><div className="ec-kpi-meta">{data.certifiedPercent}% of contract</div><div className="ec-progress"><span style={{width:`${Math.min(data.certifiedPercent,100)}%`}}/></div></div>
        <div className="ec-card"><div className="ec-kpi-label">Paid to date</div><div className="ec-kpi-value">{money(data.paidToDate,data.currency)}</div><div className="ec-kpi-meta">{data.paidPercent}% of contract</div><div className="ec-progress"><span style={{width:`${Math.min(data.paidPercent,100)}%`}}/></div></div>
        <div className="ec-card"><div className="ec-kpi-label">Remaining budget</div><div className="ec-kpi-value">{money(data.remainingBudget,data.currency)}</div><div className="ec-kpi-meta">After certified value</div></div>
      </section>

      <section className="ec-grid ec-two">
        <div className="ec-card">
          <div className="ec-card-title"><h2>Commercial & document pulse</h2><span>{data.projectCode}</span></div>
          <div className="ec-list">
            <div className="ec-list-row"><strong>Submitted IPC awaiting action</strong><span>{money(data.submittedIpc,data.currency)}</span><span>{data.ipcCount} IPC records</span><span className="ec-badge amber">Open</span></div>
            <div className="ec-list-row"><strong>Certified, unpaid exposure</strong><span>{money(data.forecast.certifiedUnpaidExposure,data.currency)}</span><span>Cash-flow exposure</span><span className={`ec-badge ${riskClass}`}>{data.forecast.risk}</span></div>
            <div className="ec-list-row"><strong>Retention held</strong><span>{money(data.retentionHeld,data.currency)}</span><span>Contract retention</span><span className="ec-badge teal">Tracked</span></div>
            <div className="ec-list-row"><strong>Approved work not in live IPC</strong><span>{money(data.approvedButUnclaimed,data.currency)}</span><span>Potential next claim</span><span className="ec-badge teal">Evidence</span></div>
            <div className="ec-list-row"><strong>Document SLA</strong><span>{data.overdueDocumentSla} overdue</span><span>{data.dueNext7Days} due in 7 days</span><span className={`ec-badge ${data.overdueDocumentSla ? 'red':'green'}`}>{data.overdueDocumentSla ? 'Action':'Healthy'}</span></div>
          </div>
        </div>
        <div className="ec-card ec-ai">
          <div className="ec-card-title"><h2><Sparkles size={15} style={{verticalAlign:'middle',marginRight:7}}/>AI commercial brief</h2><span>Grounded</span></div>
          {data.aiNarrative ? <p>{data.aiNarrative}</p> : <p>AI provider is unavailable or disabled. Deterministic project controls remain active below.</p>}
          <div className="ec-note" style={{color:'#bcd0dc'}}>AI can recommend attention areas, but cannot approve work, certify an IPC or release payment.</div>
        </div>
      </section>

      <section className="ec-grid ec-three ec-section">
        {data.suggestions.map((s,i) => <div className="ec-card" key={i}><div className="ec-insight"><AlertTriangle size={15} color="#0f766e"/><div>{s}</div></div></div>)}
      </section>
    </>}
  </div>;
}
