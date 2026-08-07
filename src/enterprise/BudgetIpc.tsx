import { useEffect, useState } from 'react';
import { enterpriseApi, type CommercialOverview, type PaymentApplication, type Project } from './enterpriseApi';

const money=(v:number|undefined,c='AED')=>new Intl.NumberFormat('en-AE',{style:'currency',currency:c,maximumFractionDigits:0}).format(v??0);
const statusClass=(s:string)=>s==='PAID'||s==='CERTIFIED'?'green':s==='REJECTED'?'red':s==='SUBMITTED'?'amber':'teal';

export default function BudgetIpc(){
 const [projects,setProjects]=useState<Project[]>([]),[projectId,setProjectId]=useState('');
 const [overview,setOverview]=useState<CommercialOverview|null>(null),[apps,setApps]=useState<PaymentApplication[]>([]),[error,setError]=useState('');
 useEffect(()=>{enterpriseApi.projects().then(p=>{setProjects(p);if(p.length)setProjectId(p[0].id)}).catch(e=>setError(String(e)))},[]);
 useEffect(()=>{if(!projectId)return;Promise.all([enterpriseApi.commercialOverview(projectId,false),enterpriseApi.paymentApplications(projectId)]).then(([o,a])=>{setOverview(o);setApps(a)}).catch(e=>setError(String(e)))},[projectId]);
 return <div className="ec-page">
  <header className="ec-topbar"><div className="ec-title"><h1>Budget & IPC Control</h1><p>Contract value, evidence-backed claims, certification, retention and payment position.</p></div><select className="ec-select" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select></header>
  {error&&<div className="ec-error">{error}</div>}
  {overview&&<>
   <section className="ec-grid ec-kpis">
    <div className="ec-card"><div className="ec-kpi-label">Contract budget</div><div className="ec-kpi-value">{money(overview.contractValue,overview.currency)}</div><div className="ec-kpi-meta">Original project contract value</div></div>
    <div className="ec-card"><div className="ec-kpi-label">Certified to date</div><div className="ec-kpi-value">{money(overview.certifiedIpc,overview.currency)}</div><div className="ec-kpi-meta">{overview.certifiedPercent}% certified</div></div>
    <div className="ec-card"><div className="ec-kpi-label">Paid to date</div><div className="ec-kpi-value">{money(overview.paidToDate,overview.currency)}</div><div className="ec-kpi-meta">{money(overview.forecast.certifiedUnpaidExposure,overview.currency)} certified unpaid</div></div>
    <div className="ec-card"><div className="ec-kpi-label">Retention held</div><div className="ec-kpi-value">{money(overview.retentionHeld,overview.currency)}</div><div className="ec-kpi-meta">Contractual retention on certified IPC</div></div>
   </section>
   <section className="ec-grid ec-three">
    <div className="ec-card"><div className="ec-kpi-label">Approved work evidence</div><div className="ec-kpi-value">{money(overview.approvedWorkEvidence,overview.currency)}</div><div className="ec-kpi-meta">Approved documents carrying work value</div></div>
    <div className="ec-card"><div className="ec-kpi-label">Approved but unclaimed</div><div className="ec-kpi-value">{money(overview.approvedButUnclaimed,overview.currency)}</div><div className="ec-kpi-meta">Candidate evidence for future IPC</div></div>
    <div className="ec-card"><div className="ec-kpi-label">Remaining budget</div><div className="ec-kpi-value">{money(overview.remainingBudget,overview.currency)}</div><div className="ec-kpi-meta">Contract less certified amount</div></div>
   </section>
  </>}
  <section className="ec-section"><div className="ec-card-title"><h2>IPC Applications</h2><span>{apps.length} records</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>IPC</th><th>Claimant</th><th>Period</th><th>Gross</th><th>Retention</th><th>Net certified</th><th>Status</th></tr></thead><tbody>{apps.map(a=><tr key={a.id}><td className="ec-doc-code">{a.applicationRef}</td><td>{a.claimedByOrgName}</td><td>{a.periodStart} → {a.periodEnd}</td><td>{money(a.grossClaimed,a.currency)}</td><td>{money(a.retentionAmount,a.currency)}</td><td>{money(a.netCertified,a.currency)}</td><td><span className={`ec-badge ${statusClass(a.status)}`}>{a.status}</span></td></tr>)}{!apps.length&&<tr><td colSpan={7}><div className="ec-empty">No IPC applications are visible for this project.</div></td></tr>}</tbody></table></div></section>
 </div>
}
