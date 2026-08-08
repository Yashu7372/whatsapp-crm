import { useEffect, useMemo, useState } from 'react';
import { enterpriseApi, type BudgetView, type ControlsSummary, type ForecastSnapshot, type Project, type ProjectContract } from './enterpriseApi';

const money=(value:number|undefined,currency='AED')=>new Intl.NumberFormat('en-AE',{style:'currency',currency,maximumFractionDigits:0}).format(value??0);
const pct=(v:number|undefined)=>`${(v??0).toFixed(1)}%`;

export default function ProjectControls(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');
  const [summary,setSummary]=useState<ControlsSummary|null>(null);
  const [contracts,setContracts]=useState<ProjectContract[]>([]);
  const [budget,setBudget]=useState<BudgetView|undefined>();
  const [forecasts,setForecasts]=useState<ForecastSnapshot[]>([]);
  const [error,setError]=useState('');

  useEffect(()=>{enterpriseApi.projects().then(p=>{setProjects(p);if(p.length)setProjectId(p[0].id)}).catch(e=>setError(String(e)))},[]);
  useEffect(()=>{
    if(!projectId)return;
    Promise.all([enterpriseApi.controlsSummary(projectId),enterpriseApi.projectContracts(projectId),enterpriseApi.forecasts(projectId)])
      .then(([s,c,f])=>{setError('');setSummary(s);setContracts(c);setForecasts(f);return enterpriseApi.currentBudget(projectId).catch(()=>undefined)})
      .then(setBudget)
      .catch(e=>setError(String(e)));
  },[projectId]);

  const topRisk=useMemo(()=>budget?.lines?.slice().sort((a,b)=>(b.forecastFinalCost-b.currentBudget)-(a.forecastFinalCost-a.currentBudget)).slice(0,5)??[],[budget]);
  const trend=forecasts.slice(0,6).reverse();

  return <div className="ec-page">
    <header className="ec-topbar"><div className="ec-title"><h1>Project Controls</h1><p>Versioned budget, party contracts and historical forecasts — the foundation for live cost, resource and KPI intelligence.</p></div><select className="ec-select" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select></header>
    {error&&<div className="ec-error">Commercial project data is restricted to authorized organization managers. {error}</div>}
    {summary&&<>
      <section className="ec-grid ec-kpis">
        <div className="ec-card"><div className="ec-kpi-label">Current budget</div><div className="ec-kpi-value">{money(summary.currentBudget,summary.currency)}</div><div className="ec-kpi-meta">{summary.visibilityScope==='PROJECT'?'Approved baseline + changes':'Your organization contract position'}</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Committed cost</div><div className="ec-kpi-value">{money(summary.committedCost,summary.currency)}</div><div className="ec-kpi-meta">Awarded/committed position</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Forecast final cost</div><div className="ec-kpi-value">{money(summary.forecastFinalCost,summary.currency)}</div><div className="ec-kpi-meta">{summary.forecastVariance<0?'Projected overrun':'Projected headroom'} {money(Math.abs(summary.forecastVariance),summary.currency)}</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Visibility</div><div className="ec-kpi-value" style={{fontSize:20}}>{summary.visibilityScope}</div><div className="ec-kpi-meta">Server-enforced commercial scope</div></div>
      </section>
      <section className="ec-grid ec-three">
        <div className="ec-card"><div className="ec-kpi-label">Actual cost</div><div className="ec-kpi-value">{money(summary.actualCost,summary.currency)}</div><div className="ec-kpi-meta">Recorded actual to date</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Estimate to complete</div><div className="ec-kpi-value">{money(summary.estimateToComplete,summary.currency)}</div><div className="ec-kpi-meta">Remaining forecasted spend</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Approved contract changes</div><div className="ec-kpi-value">{money(summary.approvedContractChanges,summary.currency)}</div><div className="ec-kpi-meta">Across your permitted commercial scope</div></div>
      </section>
    </>}

    <section className="ec-section"><div className="ec-card-title"><h2>Party contracts</h2><span>{contracts.length} visible</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Organization</th><th>Role</th><th>Contract</th><th>Commercial model</th><th>Original</th><th>Changes</th><th>Current</th></tr></thead><tbody>{contracts.map(c=><tr key={c.id}><td>{c.organizationName}</td><td><span className="ec-badge teal">{c.partyRole}</span></td><td className="ec-doc-code">{c.contractRef}</td><td>{c.commercialModel}</td><td>{money(c.originalValue,c.currency)}</td><td>{money(c.approvedVariations,c.currency)}</td><td>{money(c.currentValue,c.currency)}</td></tr>)}{!contracts.length&&<tr><td colSpan={7}><div className="ec-empty">No project contracts are visible or configured.</div></td></tr>}</tbody></table></div></section>

    {summary?.visibilityScope==='PROJECT'&&<section className="ec-section"><div className="ec-card-title"><h2>Cost-code budget</h2><span>{budget?`Version ${budget.header.versionNo} • ${budget.header.status}`:'Not configured'}</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Cost code</th><th>Budget line</th><th>Current budget</th><th>Committed</th><th>Actual</th><th>ETC</th><th>EAC</th><th>Variance</th></tr></thead><tbody>{budget?.lines.map(l=>{const variance=l.currentBudget-l.forecastFinalCost;return <tr key={l.id}><td className="ec-doc-code">{l.costCode}</td><td>{l.name}</td><td>{money(l.currentBudget,summary.currency)}</td><td>{money(l.committedCost,summary.currency)}</td><td>{money(l.actualCost,summary.currency)}</td><td>{money(l.estimateToComplete,summary.currency)}</td><td>{money(l.forecastFinalCost,summary.currency)}</td><td><span className={`ec-badge ${variance<0?'red':'green'}`}>{money(variance,summary.currency)}</span></td></tr>})}{!budget?.lines.length&&<tr><td colSpan={8}><div className="ec-empty">Create the first budget version and cost-code lines to start project forecasting.</div></td></tr>}</tbody></table></div></section>}

    <section className="ec-grid ec-two">
      {summary?.visibilityScope==='PROJECT'&&<div className="ec-card"><div className="ec-card-title"><h2>Highest forecast pressure</h2><span>Cost codes</span></div>{topRisk.map(l=><div className="ec-insight" key={l.id}><div className="ec-insight-dot"/><div><strong>{l.costCode}</strong> — {l.name}<br/><span>Forecast {money(l.forecastFinalCost,summary.currency)} vs budget {money(l.currentBudget,summary.currency)}</span></div></div>)}{!topRisk.length&&<div className="ec-empty">No budget lines yet.</div>}</div>}
      <div className="ec-card"><div className="ec-card-title"><h2>Forecast history</h2><span>Immutable snapshots</span></div>{trend.map(f=><div className="ec-insight" key={f.id}><div className="ec-insight-dot"/><div><strong>{f.snapshotDate}</strong> — {money(f.forecastFinalCost,summary?.currency)}<br/><span>{f.sourceOrganizationName??'Project'} • Physical {pct(f.physicalProgressPercent)} • Schedule {pct(f.scheduleProgressPercent)}</span></div></div>)}{!trend.length&&<div className="ec-empty">No forecast snapshots yet.</div>}</div>
    </section>
  </div>
}
