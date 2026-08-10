import { useEffect, useState } from 'react';
import { enterpriseApi, type Project, type ProjectResource, type TimeLogEntry } from './enterpriseApi';

export default function TimeLog(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState('');
  const [resources,setResources]=useState<ProjectResource[]>([]);
  const [entries,setEntries]=useState<TimeLogEntry[]>([]);
  const [resourceId,setResourceId]=useState('');
  const [hours,setHours]=useState('');
  const [description,setDescription]=useState('');
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);

  useEffect(()=>{enterpriseApi.projects().then(p=>{setProjects(p);if(p.length)setProjectId(p[0].id)}).catch(e=>setError(String(e)))},[]);

  const load=(pid:string)=>{
    Promise.all([enterpriseApi.myResources(pid),enterpriseApi.timeLog(pid)])
      .then(([r,e])=>{setError('');setResources(r);setEntries(e);if(r.length&&!resourceId)setResourceId(r[0].id)})
      .catch(e=>setError(String(e)));
  };
  useEffect(()=>{if(projectId)load(projectId)},[projectId]);

  const handleSubmit=()=>{
    if(!resourceId||!hours){setError('Pick a resource and enter hours');return;}
    const h=Number(hours);
    if(!(h>0)||h>24){setError('Hours must be between 0 and 24');return;}
    setSubmitting(true);
    enterpriseApi.submitTimeLog(projectId,{resourceId,hours:h,description:description||undefined})
      .then(()=>{setHours('');setDescription('');load(projectId);})
      .catch(e=>setError(String(e)))
      .finally(()=>setSubmitting(false));
  };

  return <div className="ec-page">
    <header className="ec-topbar">
      <div className="ec-title"><h1>Time Log</h1><p>Log hours worked. Rates and billing amounts are visible to admins/managers only — not shown here.</p></div>
      <select className="ec-select" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select>
    </header>
    {error&&<div className="ec-error">{error}</div>}

    <section className="ec-section">
      <div className="ec-card-title"><h2>Log time</h2></div>
      <div className="ec-card" style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
        <div className="form-group">
          <label className="form-label">Resource</label>
          <select className="form-select" value={resourceId} onChange={e=>setResourceId(e.target.value)}>
            {resources.map(r=><option key={r.id} value={r.id}>{r.displayName} ({r.resourceCode})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Hours</label>
          <input className="form-input" type="number" min={0} max={24} step={0.5} style={{width:100}}
            value={hours} onChange={e=>setHours(e.target.value)} />
        </div>
        <div className="form-group" style={{flex:1,minWidth:200}}>
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="What did you work on?" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
          {submitting?'Logging…':'Log time'}
        </button>
      </div>
      {!resources.length&&<div className="ec-empty">No resources set up for your organization on this project yet — ask your admin or manager to add one.</div>}
    </section>

    <section className="ec-section">
      <div className="ec-card-title"><h2>Logged time</h2><span>{entries.length} entries</span></div>
      <div className="ec-table-wrap"><table className="ec-table"><thead><tr><th>Date</th><th>Resource</th><th>Hours</th><th>Status</th><th>Description</th></tr></thead><tbody>
        {entries.map(e=><tr key={e.id}>
          <td>{e.workDate}</td>
          <td>{e.resourceName}</td>
          <td>{e.hours}</td>
          <td><span className={`ec-badge ${e.status==='APPROVED'?'green':'amber'}`}>{e.status}</span></td>
          <td>{e.description??'—'}</td>
        </tr>)}
        {!entries.length&&<tr><td colSpan={5}><div className="ec-empty">No time logged yet.</div></td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
