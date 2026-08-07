import { useEffect, useMemo, useState } from 'react';
import { enterpriseApi, type ActualCostEntry, type Project, type ProjectResource, type ResourceCostSummary } from './enterpriseApi';

const money=(v:number|undefined,c='AED')=>new Intl.NumberFormat('en-AE',{style:'currency',currency:c,maximumFractionDigits:0}).format(v??0);

export default function ResourceCosts(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');
  const [summary,setSummary]=useState<ResourceCostSummary|null>(null);
  const [resources,setResources]=useState<ProjectResource[]>([]);
  const [costs,setCosts]=useState<ActualCostEntry[]>([]);
  const [error,setError]=useState('');

  useEffect(()=>{enterpriseApi.projects().then(p=>{setProjects(p);if(p.length)setProjectId(p[0].id)}).catch(e=>setError(String(e)))},[]);
  useEffect(()=>{if(!projectId)return;setError('');Promise.all([
    enterpriseApi.resourceCostSummary(projectId),enterpriseApi.projectResources(projectId),enterpriseApi.actualCosts(projectId)
  ]).then(([s,r,c])=>{setSummary(s);setResources(r);setCosts(c)}).catch(e=>setError(String(e)))},[projectId]);

  const currency=costs[0]?.currency??projects.find(p=>p.id===projectId)?.currency??'AED';
  const byOrg=useMemo(()=>Array.from(costs.reduce((m,c)=>m.set(c.organizationName,(m.get(c.organizationName)??0)+c.amount),new Map<string,number>()).entries()).sort((a,b)=>b[1]-a[1]).slice(0,6),[costs]);
  const byCode=useMemo(()=>Array.from(costs.reduce((m,c)=>{const k=c.costCode??'Unallocated';return m.set(k,(m.get(k)??0)+c.amount)},new Map<string,number>()).entries()).sort((a,b)=>b[1]-a[1]).slice(0,6),[costs]);

  return <div className="ec-page">
    <header className="ec-topbar"><div className="ec-title"><h1>Resources & Actual Cost</h1><p>Live labour and equipment cost generated from approved operational records. Resource rates stay confidential.</p></div><select className="ec-select" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select></header>
    {error&&<div className="ec-error">{error}</div>}
    {summary&&<>
      <section className="ec-grid ec-kpis">
        <div className="ec-card"><div className="ec-kpi-label">Total actual cost</div><div className="ec-kpi-value">{money(summary.totalActualCost,currency)}</div><div className="ec-kpi-meta">Approved resource-derived actuals</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Labour cost</div><div className="ec-kpi-value">{money(summary.labourCost,currency)}</div><div className="ec-kpi-meta">Approved timesheets only</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Equipment cost</div><div className="ec-kpi-value">{money(summary.equipmentCost,currency)}</div><div className="ec-kpi-meta">Machine/equipment usage</div></div>
        <div className="ec-card"><div className="ec-kpi-label">Pending timesheets</div><div className="ec-kpi-value">{summary.pendingTimesheets}</div><div className="ec-kpi-meta">{summary.activeResources} active resources • {summary.visibilityScope}</div></div>
      </section>
    </>}

    <section className="ec-grid ec-two">
      <div className="ec-card"><div className="ec-card-title"><h2>Cost by organization</h2><span>Visible scope</span></div>{byOrg.map(([name,value])=><div className="ec-insight" key={name}><div className="ec-insight-dot"/><div><strong>{name}</strong><br/><span>{money(value,currency)}</span></div></div>)}{!byOrg.length&&<div className="ec-empty">No approved actual-cost entries yet.</div>}</div>
      <div className="ec-card"><div className="ec-card-title"><h2>Cost by cost code</h2><span>Budget allocation</span></div>{byCode.map(([code,value])=><div className="ec-insight" key={code}><div className="ec-insight-dot"/><div><strong>{code}</strong><br/><span>{money(value,currency)}</span></div></div>)}{!byCode.length&&<div className="ec-empty">Actual costs will appear here once entries are allocated to budget lines.</div>}</div>
    </section>

    <section className="ec-section"><div className="ec-card-title"><h2>Project resources</h2><span>{resources.length} visible</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Code</th><th>Resource</th><th>Type</th><th>Organization</th><th>Status</th></tr></thead><tbody>{resources.map(r=><tr key={r.id}><td className="ec-doc-code">{r.resourceCode}</td><td>{r.displayName}</td><td><span className="ec-badge teal">{r.resourceType}</span></td><td>{r.organizationName}</td><td><span className={`ec-badge ${r.active?'green':'amber'}`}>{r.active?'ACTIVE':'INACTIVE'}</span></td></tr>)}{!resources.length&&<tr><td colSpan={5}><div className="ec-empty">No resources configured for this project yet.</div></td></tr>}</tbody></table></div></section>

    <section className="ec-section"><div className="ec-card-title"><h2>Recent actual cost</h2><span>Latest 200 entries</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Date</th><th>Organization</th><th>Resource</th><th>Source</th><th>Cost code</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>{costs.map(c=><tr key={c.id}><td>{c.costDate}</td><td>{c.organizationName}</td><td>{c.resourceName??'—'}</td><td><span className="ec-badge teal">{c.sourceType}</span></td><td className="ec-doc-code">{c.costCode??'Unallocated'}</td><td>{c.quantity}</td><td>{money(c.amount,c.currency)}</td></tr>)}{!costs.length&&<tr><td colSpan={7}><div className="ec-empty">Approved timesheets and equipment usage will generate actual cost here automatically.</div></td></tr>}</tbody></table></div></section>
  </div>;
}
