import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, Clock3, FolderKanban, WalletCards } from 'lucide-react';
import { deliveryApi, type ProjectDeliveryPortfolio } from './deliveryApi';

const money = (value: number | undefined, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value ?? 0);

export default function ProjectPortfolio() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectDeliveryPortfolio | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    deliveryApi.portfolio().then(setData).catch(e => setError(String(e)));
  }, []);

  if (error) return <div className="ec-page"><div className="ec-error">{error}</div></div>;
  if (!data) return <div className="ec-page"><div className="ec-loading">Loading authorized project portfolio…</div></div>;

  return <div className="ec-page ec-portfolio-page">
    <header className="ec-hero">
      <div>
        <span className="ec-eyebrow">Enterprise delivery account</span>
        <h1>{data.accountName}</h1>
        <p>One connected view from project stages and work packages to documents, people, cost and certification evidence.</p>
      </div>
      <div className="ec-hero-badge"><Building2 size={18}/><span>{data.activeProjects} active projects</span></div>
    </header>

    <section className="ec-grid ec-kpis ec-portfolio-kpis">
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon"><WalletCards size={18}/></div><div><div className="ec-kpi-label">Portfolio contract value</div><div className="ec-kpi-value">{money(data.totalContractValue)}</div><div className="ec-kpi-meta">Across projects visible to this account</div></div></div>
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon"><FolderKanban size={18}/></div><div><div className="ec-kpi-label">Open work items</div><div className="ec-kpi-value">{data.openWorkItems}</div><div className="ec-kpi-meta">Design, authority and construction activities</div></div></div>
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon warning"><AlertTriangle size={18}/></div><div><div className="ec-kpi-label">Blocked work</div><div className="ec-kpi-value">{data.blockedWorkItems}</div><div className="ec-kpi-meta">Needs intervention before downstream work proceeds</div></div></div>
      <div className="ec-card ec-stat-card"><div className="ec-stat-icon danger"><Clock3 size={18}/></div><div><div className="ec-kpi-label">Overdue documents</div><div className="ec-kpi-value">{data.overdueDocuments}</div><div className="ec-kpi-meta">Contractual/SLA response date exceeded</div></div></div>
    </section>

    <section className="ec-section">
      <div className="ec-section-heading"><div><span className="ec-eyebrow">Projects</span><h2>Delivery portfolio</h2></div><span className="ec-kpi-meta">Select a project to drill into stages, packages and work</span></div>
      <div className="ec-project-grid">
        {data.projects.map(project => {
          const costPct = project.contractValue > 0 ? Math.min(100, (project.actualCost / project.contractValue) * 100) : 0;
          return <button className="ec-project-card" key={project.id} onClick={() => navigate(`/control/projects/${project.id}`)}>
            <div className="ec-project-card-top">
              <div><span className="ec-project-code">{project.projectCode}</span><h3>{project.name}</h3></div>
              <ArrowRight size={18}/>
            </div>
            <div className="ec-project-meta"><span>{project.participantCount} organizations</span><span>{project.completedStages}/{project.stageCount} stages complete</span></div>
            <div className="ec-project-progress-head"><span>Overall work progress</span><strong>{project.progressPercent.toFixed(1)}%</strong></div>
            <div className="ec-progress ec-progress-lg"><span style={{width:`${Math.min(100,project.progressPercent)}%`}}/></div>
            <div className="ec-project-finance">
              <div><small>Contract</small><strong>{money(project.contractValue,project.currency)}</strong></div>
              <div><small>Actual captured</small><strong>{money(project.actualCost,project.currency)}</strong></div>
              <div><small>Cost consumption</small><strong>{costPct.toFixed(1)}%</strong></div>
            </div>
            <div className="ec-project-alerts">
              <span className={project.blockedWorkItems ? 'attention' : ''}>{project.blockedWorkItems} blocked</span>
              <span className={project.overdueDocuments ? 'danger' : ''}>{project.overdueDocuments} overdue docs</span>
              <span>{project.pendingApprovals} approvals</span>
            </div>
          </button>;
        })}
      </div>
    </section>
  </div>;
}
