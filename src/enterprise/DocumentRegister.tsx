import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { enterpriseApi, type DocumentRecord } from './enterpriseApi';

const badge=(status:string)=>status==='APPROVED'||status==='PUBLISHED'?'green':status.includes('REJECT')?'red':status.includes('REVIEW')?'amber':'teal';
const securityBadge=(classification?:string)=>classification==='RESTRICTED'?'red':classification==='ORGANIZATION'?'amber':'teal';

export default function DocumentRegister() {
  const [docs,setDocs]=useState<DocumentRecord[]>([]);
  const [query,setQuery]=useState('');
  const [error,setError]=useState('');
  const load=()=>enterpriseApi.documents().then(v=>{setDocs(v);setError('')}).catch(e=>setError(String(e)));
  useEffect(()=>{void load();},[]);
  const filtered=useMemo(()=>docs.filter(d=>`${d.documentCode??''} ${d.title} ${d.docType} ${d.status} ${d.securityClassification??''} ${d.discipline??''}`.toLowerCase().includes(query.toLowerCase())),[docs,query]);

  return <div className="ec-page">
    <header className="ec-topbar"><div className="ec-title"><h1>Document Register</h1><p>Controlled register with exact revision, security scope, issue purpose, workflow status and contractual deadline.</p></div><button className="ec-btn" onClick={()=>void load()}><RefreshCw size={15}/>Refresh</button></header>
    {error&&<div className="ec-error">{error}</div>}
    <div className="ec-filterbar"><div style={{position:'relative',flex:1}}><Search size={15} style={{position:'absolute',left:12,top:12,color:'#8190a5'}}/><input className="ec-input" style={{width:'100%',paddingLeft:36}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search number, title, type, discipline, security or status"/></div></div>
    <div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Document</th><th>Type / Discipline</th><th>Revision</th><th>Security</th><th>Issue purpose</th><th>Status</th><th>Return code</th><th>SLA due</th><th>Last update</th></tr></thead><tbody>
      {filtered.map(d=><tr key={d.id}><td><div className="ec-doc-code">{d.documentCode||'Unnumbered'}</div><div>{d.title}</div>{(d.packageCode||d.locationCode)&&<small>{d.packageCode??'—'} • {d.locationCode??'—'}</small>}</td><td>{d.docType}<br/><small>{d.discipline??'—'}</small></td><td><strong>{d.currentRevisionCode??String(d.currentVersion).padStart(2,'0')}</strong><br/><small>Version {d.currentVersion}</small></td><td><span className={`ec-badge ${securityBadge(d.securityClassification)}`}>{d.securityClassification??'PROJECT'}</span></td><td>{d.issuePurpose?.replaceAll('_',' ')??'—'}</td><td><span className={`ec-badge ${badge(d.status)}`}>{d.status.replaceAll('_',' ')}</span></td><td>{d.reviewOutcome||'—'}</td><td>{d.dueAt?new Date(d.dueAt).toLocaleDateString('en-AE'):'—'}</td><td>{new Date(d.updatedAt).toLocaleDateString('en-AE')}</td></tr>)}
      {!filtered.length&&<tr><td colSpan={9}><div className="ec-empty">No documents match the current authorization scope and filter.</div></td></tr>}
    </tbody></table></div>
    <div className="ec-card ec-section"><div className="ec-card-title"><h2>Visibility policy</h2><span>Server enforced</span></div><div className="ec-insight"><div className="ec-insight-dot"/><div><strong>PROJECT</strong> — active project participants may read; only the originator company or an explicit named grant can edit/issue.</div></div><div className="ec-insight"><div className="ec-insight-dot"/><div><strong>ORGANIZATION</strong> — originator company, explicit grants and assigned reviewers only.</div></div><div className="ec-insight"><div className="ec-insight-dot"/><div><strong>RESTRICTED</strong> — explicit grants or workflow assignment only; the UI never treats hidden controls as security.</div></div></div>
  </div>;
}
