import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Files, GitBranch, Send, CheckSquare, WalletCards, TrendingUp, Gauge,
  Sparkles, ShieldCheck, MessageCircle, ArrowLeft, Building2
} from 'lucide-react';
import './enterprise.css';

const nav = [
  ['Overview', '/control', LayoutDashboard],
  ['Documents', '/control/documents', Files],
  ['Project Controls', '/control/project-controls', TrendingUp],
  ['Resources & Cost', '/control/resource-costs', Gauge],
  ['Workflows', '/control/workflows', GitBranch],
  ['Transmittals', '/control/transmittals', Send],
  ['Approvals', '/control/approvals', CheckSquare],
  ['Budget & IPC', '/control/commercial', WalletCards],
  ['AI Insights', '/control/insights', Sparkles],
  ['Audit & Compliance', '/control/audit', ShieldCheck],
  ['WhatsApp & Email', '/control/communications', MessageCircle],
] as const;

export default function EnterpriseLayout() {
  const navigate = useNavigate();
  return (
    <div className="ec-shell">
      <aside className="ec-sidebar">
        <div className="ec-brand">
          <div className="ec-brand-mark"><Building2 size={20} /></div>
          <div><strong>Project Control</strong><span>Document & Commercial</span></div>
        </div>
        <div className="ec-project-pill"><span>DXB Civil Portfolio</span><small>Enterprise workspace</small></div>
        <nav className="ec-nav">
          {nav.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} end={to === '/control'} className={({isActive}) => `ec-nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18}/><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="ec-back" onClick={() => navigate('/dashboard')}><ArrowLeft size={17}/> Existing CRM</button>
      </aside>
      <main className="ec-main"><Outlet /></main>
    </div>
  );
}
