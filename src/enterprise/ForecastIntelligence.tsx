import { useEffect, useState } from 'react';
import { enterpriseApi, type Project } from './enterpriseApi';
import { forecastApi, type ForecastDashboard } from './forecastApi';

const money=(v:number|undefined,c='AED')=>new Intl.NumberFormat('en-AE',{style:'currency',currency:c,maximumFractionDigits:0}).format(v??0);
const pct=(v:number|undefined)=>`${(v??0).toFixed(1)}%`;
const badge=(severity:string)=>severity==='CRITICAL'?'red':severity==='ATTENTION'?'amber':'teal';
const health=(score:number)=>score>=85?'green':score>=70?'amber':'red';

export default function ForecastIntelligence(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');
  const [data,setData]=useState<ForecastDashboard|null>(null);
  const [error,setError]=useState('');
  const [refreshing,setRefreshing]=useState(false);

  useEffect(()=>{enterpriseApi.projects().then(p=>{setProjects(p);if(p.length)setProjectId(p[0].id)}).catch(e=>setError(String(e)))},[]);
  useEffect(()=>{if(!projectId)return;setError('');forecastApi.dashboard(projectId).then(setData).catch(e=>setError(String(e)))},[projectId]);

  const refresh=()=>{if(!projectId)return;setRefreshing(true);setError('');forecastApi.refresh(projectId).then(setData).catch(e=>setError(String(e))).finally(()=>setRefreshing(false));};
  const latest=data?.latest;
  const currency=projects.find(p=>p.id===projectId)?.currency??'AED';

  return <div className="ec-page">
    <header className="ec-topbar"><div className="ec-title"><h1>Forecast & Early Warning</h1><p>Deterministic project forecast, cost/schedule warnings and consultant control-health measurements.</p></div><div style={{display:'flex',gap:10}}><select className="ec-select" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select><button className="ec-button" onClick={refresh} disabled={refreshing}>{refreshing?'Refreshing…':'Refresh controls'}</button></div></header>
    {error&&<div className="ec-error">{error}</div>}
    {!latest&&<div className="ec-card"><div className="ec-empty">No control forecast snapshot exists yet. Use Refresh controls to derive the first snapshot from current project facts.</div></div>}
    {latest&&<>
      <section className="ec-grid ec-kpis">
        <div className="ec-card"><div className="ec-kpi-label">Current budget</div><div className="ec-kpi-value">{money(latest.currentBudget,currency)}</div><div className="ec-kpi-meta">Approved baseline + approved changes</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Base EAC</div><div className="ec-kpi-value">{money(latest.baseEac,currency)}</div><div className="ec-kpi-meta">Max(actual + ETC, committed)</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Exposure EAC</div><div className="ec-kpi-value">{money(latest.exposureEac,currency)}</div><div className="ec-kpi-meta">Base EAC + open variation exposure</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Forecast variance</div><div className="ec-kpi-value">{money(latest.forecastVariance,currency)}</div><div className={`ec-kpi-meta ${latest.forecastVariance<0?'ec-danger':''}`}>{latest.forecastVariance<0?'Potential overrun':'Current headroom'}</div></div>
      </section>
      <section className="ec-grid ec-three">
        <div className="ec-card"><div className="ec-kpi-label">Cost consumed</div><div className="ec-kpi-value">{pct(latest.costConsumptionPercent)}</div><div className="ec-kpi-meta">Actual / current budget</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Physical progress</div><div className="ec-kpi-value">{pct(latest.physicalProgressPercent)}</div><div className="ec-kpi-meta">Latest reported project progress</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Programme progress</div><div className="ec-kpi-value">{pct(latest.scheduleProgressPercent)}</div><div className="ec-kpi-meta">Latest schedule-progress baseline</div></div>
      </section>
    </>}

    <section className="ec-section"><div className="ec-card-title"><h2>Early warnings</h2><span>{data?.warnings.length??0} active</span></div><div className="ec-grid ec-two">{data?.warnings.map(w=><div className="ec-card" key={w.code}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{w.title}</strong><span className={`ec-badge ${badge(w.severity)}`}>{w.severity}</span></div><div className="ec-kpi-meta" style={{marginTop:8}}>{w.code} • metric {w.metricValue??0} • threshold {w.thresholdValue??0}</div></div>)}{!data?.warnings.length&&<div className="ec-card"><div className="ec-empty">No deterministic warning threshold is currently breached.</div></div>}</div></section>

    <section className="ec-section"><div className="ec-card-title"><h2>Consultant control health</h2><span>Advisory operational KPI, not contractual certification</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Consultant</th><th>Overall</th><th>Document SLA health</th><th>Forecast alignment</th><th>Overdue docs</th><th>Party forecast</th><th>Control forecast</th><th>Gap</th></tr></thead><tbody>{data?.consultantKpis.map(k=><tr key={k.organizationId}><td>{k.organizationName}</td><td><span className={`ec-badge ${health(k.overallControlHealth)}`}>{pct(k.overallControlHealth)}</span></td><td>{pct(k.documentSlaHealth)}</td><td>{pct(k.forecastAlignment)}</td><td>{k.overdueDocuments} / {k.dueDocuments}</td><td>{money(k.latestPartyForecast,currency)}</td><td>{money(k.controlForecast,currency)}</td><td>{money(k.forecastGap,currency)}</td></tr>)}{!data?.consultantKpis.length&&<tr><td colSpan={8}><div className="ec-empty">No consultant KPI snapshot exists for this project yet.</div></td></tr>}</tbody></table></div></section>

    <section className="ec-section"><div className="ec-card-title"><h2>Forecast history</h2><span>Daily derived snapshots</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Date</th><th>Budget</th><th>Actual</th><th>Committed</th><th>Base EAC</th><th>Exposure EAC</th><th>Variance</th></tr></thead><tbody>{data?.history.map(h=><tr key={h.id}><td>{h.snapshotDate}</td><td>{money(h.currentBudget,currency)}</td><td>{money(h.actualCost,currency)}</td><td>{money(h.committedCost,currency)}</td><td>{money(h.baseEac,currency)}</td><td>{money(h.exposureEac,currency)}</td><td>{money(h.forecastVariance,currency)}</td></tr>)}</tbody></table></div></section>
  </div>
}
