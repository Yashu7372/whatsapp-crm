import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { enterpriseApi, type DocumentRecord } from './enterpriseApi';

const badge = (status: string) => status === 'APPROVED' ? 'green' : status.includes('REJECT') ? 'red' : status.includes('REVIEW') ? 'amber' : 'teal';

export default function DocumentRegister() {
  const [docs,setDocs] = useState<DocumentRecord[]>([]);
  const [query,setQuery] = useState('');
  const [error,setError] = useState('');
  const load=()=>enterpriseApi.documents().then(setDocs).catch(e=>setError(String(e)));
  useEffect(()=>{load();},[]);
  const filtered=useMemo(()=>docs.filter(d=>`${d.documentCode??''} ${d.title} ${d.docType} ${d.status}`.toLowerCase().includes(query.toLowerCase())),[docs,query]);
  return <div className="ec-page">
    <header className="ec-topbar"><div className="ec-title"><h1>Document Register</h1><p>Controlled register with revision, workflow status and contractual response deadline.</p></div><button className="ec-btn" onClick={load}><RefreshCw size={15}/>Refresh</button></header>
    {error&&<div className="ec-error">{error}</div>}
    <div className="ec-filterbar"><div style={{position:'relative',flex:1}}><Search size={15} style={{position:'absolute',left:12,top:12,color:'#8190a5'}}/><input className="ec-input" style={{width:'100%',paddingLeft:36}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search document number, title, type or status"/></div></div>
    <div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Document</th><th>Type</th><th>Revision</th><th>Status</th><th>Return code</th><th>SLA due</th><th>Last update</th></tr></thead><tbody>
      {filtered.map(d=><tr key={d.id}><td><div className="ec-doc-code">{d.documentCode||'Unnumbered'}</div><div>{d.title}</div></td><td>{d.docType}</td><td>Rev {d.currentVersion}</td><td><span className={`ec-badge ${badge(d.status)}`}>{d.status.replaceAll('_',' ')}</span></td><td>{d.reviewOutcome||'—'}</td><td>{d.dueAt?new Date(d.dueAt).toLocaleDateString('en-AE'):'—'}</td><td>{new Date(d.updatedAt).toLocaleDateString('en-AE')}</td></tr>)}
      {!filtered.length&&<tr><td colSpan={7}><div className="ec-empty">No documents match the current filter.</div></td></tr>}
    </tbody></table></div>
  </div>;
}
