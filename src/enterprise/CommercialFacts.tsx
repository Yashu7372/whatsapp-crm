import { useEffect, useMemo, useState } from 'react';
import { enterpriseApi, type Commitment, type CommercialFactSummary, type MaterialReceipt, type Project, type Variation } from './enterpriseApi';

const money=(value:number|undefined,currency='AED')=>new Intl.NumberFormat('en-AE',{style:'currency',currency,maximumFractionDigits:0}).format(value??0);
const badge=(status:string)=>status==='APPROVED'||status==='ACTIVE'||status==='ACCEPTED'?'green':status==='REJECTED'||status==='CANCELLED'?'red':status==='UNDER_REVIEW'||status==='PROPOSED'?'amber':'teal';

export default function CommercialFacts(){
  const [projects,setProjects]=useState<Project[]>([]),[projectId,setProjectId]=useState('');
  const [summary,setSummary]=useState<CommercialFactSummary|null>(null),[commitments,setCommitments]=useState<Commitment[]>([]),[materials,setMaterials]=useState<MaterialReceipt[]>([]),[variations,setVariations]=useState<Variation[]>([]),[error,setError]=useState('');

  useEffect(()=>{enterpriseApi.projects().then(p=>{setProjects(p);if(p.length)setProjectId(p[0].id)}).catch(e=>setError(String(e)))},[]);
  useEffect(()=>{if(!projectId)return;setError('');Promise.all([
    enterpriseApi.commercialFactSummary(projectId),enterpriseApi.commitments(projectId),enterpriseApi.materialReceipts(projectId),enterpriseApi.variations(projectId)
  ]).then(([s,c,m,v])=>{setSummary(s);setCommitments(c);setMaterials(m);setVariations(v)}).catch(e=>setError(String(e)))},[projectId]);

  const currency=commitments[0]?.currency||materials[0]?.currency||variations[0]?.currency||'AED';
  const variationPressure=useMemo(()=>variations.filter(v=>v.status==='PROPOSED'||v.status==='UNDER_REVIEW').sort((a,b)=>b.requestedAmount-a.requestedAmount).slice(0,5),[variations]);

  return <div className="ec-page">
    <header className="ec-topbar"><div className="ec-title"><h1>Commitments, Materials & Variations</h1><p>Committed cost, accepted material actuals and change exposure feeding the project-controls budget.</p></div><select className="ec-select" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select></header>
    {error&&<div className="ec-error">{error}</div>}
    {summary&&<section className="ec-grid ec-kpis">
      <div className="ec-card"><div className="ec-kpi-label">Active commitments</div><div className="ec-kpi-value">{money(summary.activeCommitments,currency)}</div><div className="ec-kpi-meta">POs and subcontracts currently committed</div></div>
      <div className="ec-card"><div className="ec-kpi-label">Material actual</div><div className="ec-kpi-value">{money(summary.acceptedMaterialActual,currency)}</div><div className="ec-kpi-meta">Accepted receipts recognized as actual cost</div></div>
      <div className="ec-card"><div className="ec-kpi-label">Pending variation exposure</div><div className="ec-kpi-value">{money(summary.pendingVariationExposure,currency)}</div><div className="ec-kpi-meta">Proposed / under-review change requests</div></div>
      <div className="ec-card"><div className="ec-kpi-label">Approved variations</div><div className="ec-kpi-value">{money(summary.approvedVariations,currency)}</div><div className="ec-kpi-meta">Approved budget movement</div></div>
    </section>}

    <section className="ec-grid ec-two">
      <div className="ec-card"><div className="ec-card-title"><h2>Variation pressure</h2><span>{summary?.visibilityScope??'—'} scope</span></div>{variationPressure.map(v=><div className="ec-insight" key={v.id}><div className="ec-insight-dot"/><div><strong>{v.variationRef}</strong> — {v.title}<br/><span>{v.costCode??'Unallocated'} • requested {money(v.requestedAmount,v.currency)}</span></div></div>)}{!variationPressure.length&&<div className="ec-empty">No open variation exposure.</div>}</div>
      <div className="ec-card"><div className="ec-card-title"><h2>Commercial flow</h2><span>Batch 3</span></div><div className="ec-insight"><div className="ec-insight-dot"/><div><strong>Commitment → committed cost</strong><br/><span>Active PO/subcontract values roll into their cost code.</span></div></div><div className="ec-insight"><div className="ec-insight-dot"/><div><strong>Accepted material → actual cost</strong><br/><span>Material receipts augment labour/equipment actuals.</span></div></div><div className="ec-insight"><div className="ec-insight-dot"/><div><strong>Approved variation → budget change</strong><br/><span>Pending variations remain exposure until approval.</span></div></div></div>
    </section>

    <section className="ec-section"><div className="ec-card-title"><h2>Commitments</h2><span>{commitments.length} records</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Reference</th><th>Organization</th><th>Type</th><th>Cost code</th><th>Original</th><th>Changes</th><th>Current</th><th>Status</th></tr></thead><tbody>{commitments.map(c=><tr key={c.id}><td className="ec-doc-code">{c.referenceNo}</td><td>{c.organizationName}</td><td>{c.commitmentType}</td><td>{c.costCode??'—'}</td><td>{money(c.originalAmount,c.currency)}</td><td>{money(c.approvedChanges,c.currency)}</td><td>{money(c.currentAmount,c.currency)}</td><td><span className={`ec-badge ${badge(c.status)}`}>{c.status}</span></td></tr>)}{!commitments.length&&<tr><td colSpan={8}><div className="ec-empty">No commitments configured yet.</div></td></tr>}</tbody></table></div></section>

    <section className="ec-section"><div className="ec-card-title"><h2>Material receipts</h2><span>{materials.length} recent</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Receipt</th><th>Date</th><th>Organization</th><th>Material</th><th>Commitment</th><th>Cost code</th><th>Quantity</th><th>Amount</th><th>Status</th></tr></thead><tbody>{materials.map(m=><tr key={m.id}><td className="ec-doc-code">{m.receiptRef}</td><td>{m.receiptDate}</td><td>{m.organizationName}</td><td>{m.materialCode??m.description}</td><td>{m.commitmentReference??'—'}</td><td>{m.costCode??'—'}</td><td>{m.quantity} {m.unit??''}</td><td>{money(m.amount,m.currency)}</td><td><span className={`ec-badge ${badge(m.status)}`}>{m.status}</span></td></tr>)}{!materials.length&&<tr><td colSpan={9}><div className="ec-empty">No material receipts recorded yet.</div></td></tr>}</tbody></table></div></section>

    <section className="ec-section"><div className="ec-card-title"><h2>Variations / Change Orders</h2><span>{variations.length} records</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Variation</th><th>Organization</th><th>Source</th><th>Cost code</th><th>Requested</th><th>Approved</th><th>Status</th></tr></thead><tbody>{variations.map(v=><tr key={v.id}><td><div className="ec-doc-code">{v.variationRef}</div><small>{v.title}</small></td><td>{v.organizationName??'Project'}</td><td>{v.sourceType??'OTHER'}</td><td>{v.costCode??'—'}</td><td>{money(v.requestedAmount,v.currency)}</td><td>{money(v.approvedAmount,v.currency)}</td><td><span className={`ec-badge ${badge(v.status)}`}>{v.status}</span></td></tr>)}{!variations.length&&<tr><td colSpan={7}><div className="ec-empty">No variations recorded yet.</div></td></tr>}</tbody></table></div></section>
  </div>;
}
