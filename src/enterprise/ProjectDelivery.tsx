import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, CalendarDays, CheckCircle2, ChevronRight, Clock3, FileText, HardHat, Users, WalletCards } from 'lucide-react';
import { deliveryApi, type ProjectDeliveryDetail, type ProjectStage, type WorkItem, type WorkPackage } from './deliveryApi';

const money = (value: number | undefined, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value ?? 0);
const date = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const statusClass = (status: string) => status === 'COMPLETED' || status === 'APPROVED' ? 'green' : status === 'BLOCKED' || status === 'REJECTED' ? 'red' : status === 'IN_PROGRESS' || status === 'IN_REVIEW' ? 'amber' : 'teal';

export default function ProjectDelivery() {
  const navigate = useNavigate();
  const { projectId = '' } = useParams();
  const [data, setData] = useState<ProjectDeliveryDetail | null>(null);
  const [stageId, setStageId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [workItemId, setWorkItemId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    deliveryApi.project(projectId).then(d => {
      setData(d);
      const firstActive = d.stages.find(s => s.status === 'IN_PROGRESS') ?? d.stages[0];
      setStageId(firstActive?.id ?? '');
    }).catch(e => setError(String(e)));
  }, [projectId]);

  const stage = useMemo<ProjectStage | undefined>(() => data?.stages.find(s => s.id === stageId), [data, stageId]);
  const pkg = useMemo<WorkPackage | undefined>(() => stage?.workPackages.find(p => p.id === packageId), [stage, packageId]);
  const workItem = useMemo<WorkItem | undefined>(() => pkg?.workItems.find(w => w.id === workItemId), [pkg, workItemId]);

  useEffect(() => {
    if (!stage) return;
    const first = stage.workPackages[0];
    setPackageId(first?.id ?? '');
  }, [stageId, stage]);
  useEffect(() => {
    if (!pkg) return;
    const preferred = pkg.workItems.find(w => w.status === 'BLOCKED') ?? pkg.workItems.find(w => w.status !== 'COMPLETED') ?? pkg.workItems[0];
    setWorkItemId(preferred?.id ?? '');
  }, [packageId, pkg]);

  if (error) return <div className="ec-page"><div className="ec-error">{error}</div></div>;
  if (!data) return <div className="ec-page"><div className="ec-loading">Loading project delivery model…</div></div>;

  const variance = workItem ? workItem.budgetAmount - workItem.actualCost : 0;

  return <div className="ec-page ec-delivery-page">
    <button className="ec-link-button" onClick={() => navigate('/control/projects')}><ArrowLeft size={15}/> Portfolio</button>
    <header className="ec-project-header">
      <div>
        <div className="ec-breadcrumb"><span>{data.projectCode}</span><ChevronRight size={13}/><span>Delivery control</span></div>
        <h1>{data.name}</h1>
        <p>{data.description}</p>
      </div>
      <div className="ec-project-header-meta"><span className="ec-badge teal">{data.status}</span><span><CalendarDays size={14}/>{date(data.startDate)} → {date(data.endDate)}</span></div>
    </header>

    <section className="ec-grid ec-kpis">
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon"><CheckCircle2 size={18}/></div><div><div className="ec-kpi-label">Overall progress</div><div className="ec-kpi-value">{data.kpis.progressPercent.toFixed(1)}%</div><div className="ec-kpi-meta">{data.kpis.completedStages}/{data.kpis.stageCount} stages complete</div></div></div>
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon"><WalletCards size={18}/></div><div><div className="ec-kpi-label">Captured actual cost</div><div className="ec-kpi-value">{money(data.kpis.actualCost,data.currency)}</div><div className="ec-kpi-meta">Contract {money(data.contractValue,data.currency)}</div></div></div>
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon warning"><AlertCircle size={18}/></div><div><div className="ec-kpi-label">Blocked work</div><div className="ec-kpi-value">{data.kpis.blockedWorkItems}</div><div className="ec-kpi-meta">{data.kpis.openWorkItems} open work items</div></div></div>
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon danger"><Clock3 size={18}/></div><div><div className="ec-kpi-label">Control attention</div><div className="ec-kpi-value">{data.kpis.overdueDocuments + data.kpis.pendingApprovals}</div><div className="ec-kpi-meta">{data.kpis.overdueDocuments} overdue docs · {data.kpis.pendingApprovals} approvals</div></div></div>
    </section>

    <section className="ec-participant-strip">
      <div className="ec-participant-title"><Users size={16}/><strong>Project organizations</strong></div>
      {data.participants.map(p => <div className="ec-participant" key={p.id}><span className={`ec-party-dot ${p.partyRole.toLowerCase()}`}/><div><strong>{p.organizationName}</strong><small>{p.partyRole} · {p.staffCount} team members</small></div></div>)}
    </section>

    <section className="ec-stage-section">
      <div className="ec-section-heading"><div><span className="ec-eyebrow">Project lifecycle</span><h2>Stages</h2></div><span className="ec-kpi-meta">The lifecycle is project configuration, not hard-coded workflow logic.</span></div>
      <div className="ec-stage-rail">
        {data.stages.map((s, index) => <button key={s.id} className={`ec-stage-node ${s.id===stageId?'active':''} ${s.status==='COMPLETED'?'complete':''}`} onClick={() => setStageId(s.id)}>
          <div className="ec-stage-sequence">{s.status==='COMPLETED'?<CheckCircle2 size={17}/>:index+1}</div>
          <div className="ec-stage-copy"><strong>{s.name}</strong><span>{s.progressPercent.toFixed(0)}% · {s.status.replaceAll('_',' ')}</span></div>
        </button>)}
      </div>
    </section>

    {stage && <section className="ec-workspace-grid">
      <div className="ec-work-browser ec-card">
        <div className="ec-card-title"><div><span className="ec-eyebrow">{stage.stageCode}</span><h2>{stage.name}</h2></div><span className={`ec-badge ${statusClass(stage.status)}`}>{stage.status.replaceAll('_',' ')}</span></div>
        <div className="ec-stage-summary">
          <div><small>Progress</small><strong>{stage.progressPercent.toFixed(0)}%</strong></div>
          <div><small>Package budget</small><strong>{money(stage.budgetAmount,data.currency)}</strong></div>
          <div><small>Actual</small><strong>{money(stage.actualCost,data.currency)}</strong></div>
          <div><small>Blocked</small><strong>{stage.blockedWorkItems}</strong></div>
        </div>
        <div className="ec-package-tabs">
          {stage.workPackages.map(p => <button key={p.id} className={p.id===packageId?'active':''} onClick={() => setPackageId(p.id)}><span>{p.packageCode}</span><strong>{p.name}</strong><small>{p.progressPercent.toFixed(0)}% · {p.workItems.length} items</small></button>)}
        </div>
        {pkg && <div className="ec-work-list">
          <div className="ec-work-list-head"><div><strong>{pkg.name}</strong><span>{pkg.discipline}</span></div><span>{money(pkg.actualCost,data.currency)} actual · {pkg.totalHours.toFixed(1)}h</span></div>
          {pkg.workItems.map(item => <button key={item.id} className={`ec-work-row ${item.id===workItemId?'active':''}`} onClick={() => setWorkItemId(item.id)}>
            <div className={`ec-work-state ${statusClass(item.status)}`}/>
            <div className="ec-work-main"><span className="ec-project-code">{item.itemCode}</span><strong>{item.name}</strong><small>{item.responsibleOrganizationName ?? 'Unassigned'} · {item.workType.replaceAll('_',' ')}</small></div>
            <div className="ec-work-metrics"><span>{item.progressPercent.toFixed(0)}%</span><span>{item.documentCount} docs</span><span>{item.totalHours.toFixed(1)}h</span></div>
            <span className={`ec-badge ${statusClass(item.status)}`}>{item.status.replaceAll('_',' ')}</span>
          </button>)}
        </div>}
      </div>

      <aside className="ec-work-detail">
        {workItem ? <>
          <div className="ec-card ec-work-detail-card">
            <div className="ec-detail-head"><div><span className="ec-project-code">{workItem.itemCode}</span><h2>{workItem.name}</h2></div><span className={`ec-badge ${statusClass(workItem.status)}`}>{workItem.status.replaceAll('_',' ')}</span></div>
            <div className="ec-progress ec-progress-lg"><span style={{width:`${Math.min(100,workItem.progressPercent)}%`}}/></div>
            {workItem.blockedReason && <div className="ec-blocker"><AlertCircle size={17}/><div><strong>Why this work is blocked</strong><p>{workItem.blockedReason}</p></div></div>}
            <div className="ec-detail-stats">
              <div><small>Budget</small><strong>{money(workItem.budgetAmount,data.currency)}</strong></div>
              <div><small>Actual</small><strong>{money(workItem.actualCost,data.currency)}</strong></div>
              <div><small>Variance</small><strong className={variance<0?'ec-text-danger':'ec-text-success'}>{money(variance,data.currency)}</strong></div>
              <div><small>Logged time</small><strong>{workItem.totalHours.toFixed(1)} h</strong></div>
            </div>
            <div className="ec-detail-line"><CalendarDays size={15}/><span>{date(workItem.plannedStart)} → {date(workItem.plannedEnd)}</span></div>
            <div className="ec-detail-line"><Building2 size={15}/><span>{workItem.responsibleOrganizationName ?? 'No responsible organization'}</span></div>
          </div>

          <div className="ec-card">
            <div className="ec-card-title"><h2><HardHat size={15}/> Assigned team</h2><span>{workItem.assignments.length}</span></div>
            <div className="ec-assignment-list">{workItem.assignments.map(a => <div key={`${a.userId}-${a.responsibility}`} className="ec-assignment"><div className="ec-avatar">{a.fullName.split(' ').map(v=>v[0]).slice(0,2).join('')}</div><div><strong>{a.fullName}</strong><span>{a.jobTitle ?? a.accessRole} · {a.organizationName}</span><small>{a.responsibility.replaceAll('_',' ')} · Access: {a.accessRole}</small></div></div>)}</div>
          </div>

          <div className="ec-card">
            <div className="ec-card-title"><h2><FileText size={15}/> Connected documents</h2><span>{workItem.documents.length}</span></div>
            <div className="ec-document-list">{workItem.documents.map(d => <div className="ec-document-row" key={d.id}><div><span className="ec-project-code">{d.documentCode ?? 'UNNUMBERED'} · Rev {d.revisionCode ?? '—'}</span><strong>{d.title}</strong><small>{d.docType.replaceAll('_',' ')}{d.reviewOutcome?` · ${d.reviewOutcome}`:''}</small></div><span className={`ec-badge ${statusClass(d.status)}`}>{d.status.replaceAll('_',' ')}</span></div>)}{!workItem.documents.length&&<div className="ec-empty compact">No documents linked to this work item yet.</div>}</div>
          </div>
        </> : <div className="ec-card ec-empty">Select a work item to inspect its evidence, team, cost and blockers.</div>}
      </aside>
    </section>}
  </div>;
}
