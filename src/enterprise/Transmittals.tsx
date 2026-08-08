import { useEffect, useMemo, useState } from 'react';
import { enterpriseApi, type Project, type Transmittal } from './enterpriseApi';

const badge=(status:string)=>status==='ACKNOWLEDGED'||status==='CLOSED'?'green':status==='ISSUED'||status==='PARTIALLY_ACKNOWLEDGED'?'amber':'teal';

export default function Transmittals(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');
  const [items,setItems]=useState<Transmittal[]>([]);
  const [error,setError]=useState('');
  const [creating,setCreating]=useState(false);
  const [number,setNumber]=useState('');
  const [purpose,setPurpose]=useState('FOR_INFORMATION');
  const [subject,setSubject]=useState('');

  useEffect(()=>{enterpriseApi.projects().then(p=>{setProjects(p);if(p.length)setProjectId(p[0].id)}).catch(e=>setError(String(e)))},[]);
  useEffect(()=>{if(!projectId)return;enterpriseApi.transmittals(projectId).then(v=>{setItems(v);setError('')}).catch(e=>setError(String(e)))},[projectId]);

  const counts=useMemo(()=>({draft:items.filter(x=>x.status==='DRAFT').length,issued:items.filter(x=>x.status==='ISSUED'||x.status==='PARTIALLY_ACKNOWLEDGED').length,ack:items.filter(x=>x.status==='ACKNOWLEDGED'||x.status==='CLOSED').length}),[items]);

  const create=async()=>{
    if(!projectId||!number.trim())return;
    setCreating(true);setError('');
    try{
      await enterpriseApi.createTransmittal(projectId,{transmittalNo:number.trim(),purpose,subject:subject.trim()||undefined});
      const next=await enterpriseApi.transmittals(projectId);setItems(next);setNumber('');setSubject('');
    }catch(e){setError(String(e))}finally{setCreating(false)}
  };

  return <div className="ec-page">
    <header className="ec-topbar"><div className="ec-title"><h1>Transmittals</h1><p>Formal issue packages tied to exact document revisions, sender/recipient organizations and acknowledgement history.</p></div><select className="ec-select" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select></header>
    {error&&<div className="ec-error">{error}</div>}

    <section className="ec-grid ec-three">
      <div className="ec-card"><div className="ec-kpi-label">Draft</div><div className="ec-kpi-value">{counts.draft}</div><div className="ec-kpi-meta">Sender organization can still change items/recipients</div></div>
      <div className="ec-card"><div className="ec-kpi-label">Awaiting receipt</div><div className="ec-kpi-value">{counts.issued}</div><div className="ec-kpi-meta">Issued or partially acknowledged</div></div>
      <div className="ec-card"><div className="ec-kpi-label">Acknowledged</div><div className="ec-kpi-value">{counts.ack}</div><div className="ec-kpi-meta">All recipients acknowledged</div></div>
    </section>

    <section className="ec-card ec-section">
      <div className="ec-card-title"><h2>Create draft transmittal</h2><span>Server-scoped sender organization</span></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 2fr auto',gap:10,alignItems:'end'}}>
        <label><small>Transmittal no.</small><input className="ec-input" value={number} onChange={e=>setNumber(e.target.value)} placeholder="TR-0001"/></label>
        <label><small>Purpose</small><select className="ec-select" value={purpose} onChange={e=>setPurpose(e.target.value)}><option>FOR_INFORMATION</option><option>FOR_REVIEW</option><option>FOR_APPROVAL</option><option>FOR_CONSTRUCTION</option><option>AS_BUILT</option></select></label>
        <label><small>Subject</small><input className="ec-input" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Issue package subject"/></label>
        <button className="ec-button" disabled={creating||!number.trim()} onClick={()=>void create()}>{creating?'Creating…':'Create draft'}</button>
      </div>
      <div className="ec-kpi-meta" style={{marginTop:10}}>The backend derives the sender company from the authenticated user. Documents/recipients can only be added while the transmittal is DRAFT; issue requires at least one exact ISSUED revision and one active recipient organization.</div>
    </section>

    <section className="ec-section"><div className="ec-card-title"><h2>Transmittal register</h2><span>{items.length} visible in your organization scope</span></div><div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>No.</th><th>Sender</th><th>Purpose</th><th>Subject</th><th>Documents</th><th>Recipients</th><th>Status</th><th>Issued</th></tr></thead><tbody>{items.map(t=><tr key={t.id}><td className="ec-doc-code">{t.transmittalNo}</td><td>{t.senderOrganizationName}</td><td>{t.purpose}</td><td>{t.subject??'—'}</td><td>{t.itemCount}</td><td>{t.recipientCount}</td><td><span className={`ec-badge ${badge(t.status)}`}>{t.status}</span></td><td>{t.issuedAt?new Date(t.issuedAt).toLocaleString():'—'}</td></tr>)}{!items.length&&<tr><td colSpan={8}><div className="ec-empty">No transmittals are visible for this project/company scope yet.</div></td></tr>}</tbody></table></div></section>

    <section className="ec-card ec-section"><div className="ec-card-title"><h2>Control rule</h2><span>Immutable issue evidence</span></div><div className="ec-insight"><div className="ec-insight-dot"/><div>An issued transmittal points to <strong>document + exact revision</strong>. A later revision never changes the historical issue package.</div></div><div className="ec-insight"><div className="ec-insight-dot"/><div>Normal users see only transmittals where their company is sender or recipient. Client-wide visibility must come from an explicit server permission, not a frontend route.</div></div></section>
  </div>;
}
