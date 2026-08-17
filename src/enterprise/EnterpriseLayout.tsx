import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Bot, BriefcaseBusiness, Building2, ClipboardCheck, Clock3, FileText, FolderKanban, Gauge, MessageCircle, Settings2, ShieldCheck, UsersRound, WalletCards, Workflow } from 'lucide-react';
import { useNav } from '../contexts/NavContext';
import './enterprise.css';

type NavItem = { label:string; route:string; icon:React.ComponentType<{size?:number}> };

const primary: NavItem[] = [
  { label:'Projects', route:'/control/projects', icon:FolderKanban },
  { label:'Documents', route:'/control/documents', icon:FileText },
  { label:'My approvals', route:'/control/approvals', icon:ClipboardCheck },
  { label:'Project controls', route:'/control/project-controls', icon:Gauge },
  { label:'Budget & IPC', route:'/control/commercial', icon:WalletCards },
  { label:'Resources & cost', route:'/control/resource-costs', icon:UsersRound },
  { label:'Time log', route:'/control/time-log', icon:Clock3 },
];
const control: NavItem[] = [
  { label:'Commercial facts', route:'/control/commercial-facts', icon:BriefcaseBusiness },
  { label:'Forecast intelligence', route:'/control/forecast-intelligence', icon:Gauge },
  { label:'Workflows', route:'/control/workflows', icon:Workflow },
  { label:'Transmittals', route:'/control/transmittals', icon:MessageCircle },
  { label:'Notifications', route:'/control/communications', icon:Bell },
];
const administration: NavItem[] = [
  { label:'Security & access', route:'/control/security', icon:ShieldCheck },
  { label:'Roles & permissions', route:'/control/roles', icon:Settings2 },
  { label:'Audit', route:'/control/audit', icon:ClipboardCheck },
];

export default function EnterpriseLayout() {
  const { items, loading } = useNav();
  const catalogRoutes = new Set(items.filter(i=>i.module==='PROJECT_CONTROL').map(i=>i.route).filter(Boolean));
  // Hiding links is convenience only; every API continues to enforce authorization server-side.
  // While the catalog is still loading, don't fail open the way an empty catalog does — that would
  // flash admin-only links (Security & access, Roles & permissions) to every user until the real
  // list arrives.
  const visible = (item:NavItem) =>
    item.route==='/control/projects' || (!loading && (catalogRoutes.size===0 || catalogRoutes.has(item.route)));
  const links = (values:NavItem[]) => values.filter(visible).map(item => {
    const Icon=item.icon;
    return <NavLink key={item.route} to={item.route} className={({isActive})=>`ec-nav-link ${isActive?'active':''}`}>
      <Icon size={17}/><span>{item.label}</span>
    </NavLink>;
  });

  return <div className="ec-shell">
    <aside className="ec-sidebar">
      <div className="ec-brand">
        <div className="ec-brand-mark"><Building2 size={20}/></div>
        <div><strong>Delivery Control</strong><span>Enterprise project workspace</span></div>
      </div>
      <div className="ec-workspace-pill"><span className="ec-live-dot"/><div><strong>Connected delivery</strong><small>Documents · work · cost · evidence</small></div></div>
      <nav className="ec-nav">
        <div className="ec-nav-group"><small>Delivery</small>{links(primary)}</div>
        <div className="ec-nav-group"><small>Control & intelligence</small>{links(control)}</div>
        <div className="ec-nav-group"><small>Administration</small>{links(administration)}</div>
      </nav>
      <div className="ec-sidebar-footer">
        <NavLink to="/inbox" className="ec-utility-link"><MessageCircle size={16}/><span>WhatsApp inbox</span></NavLink>
        <NavLink to="/settings/bot" className="ec-utility-link"><Bot size={16}/><span>Bot configuration</span></NavLink>
        <div className="ec-sidebar-note"><span className="ec-live-dot"/><span>Enterprise mode active</span></div>
      </div>
    </aside>
    <main className="ec-main"><Outlet/></main>
  </div>;
}
