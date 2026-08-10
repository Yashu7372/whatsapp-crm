import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Building2, ArrowLeft } from 'lucide-react';
import { useNav } from '../contexts/NavContext';
import './enterprise.css';

const iconRegistry = LucideIcons as unknown as Record<string, LucideIcon>;

function resolveIcon(name: string | null): LucideIcon {
  return (name && iconRegistry[name]) || LucideIcons.Circle;
}

export default function EnterpriseLayout() {
  const navigate = useNavigate();
  const { items } = useNav();

  // Same catalog-driven nav as the main sidebar, scoped to the Project
  // Control module. The master switch (PROJECT_CONTROL_SUITE) is the link
  // shown in the main sidebar to get here, not a link within this layout.
  const navItems = items.filter(
    (item) => item.module === 'PROJECT_CONTROL' && item.featureCode !== 'PROJECT_CONTROL_SUITE'
  );

  return (
    <div className="ec-shell">
      <aside className="ec-sidebar">
        <div className="ec-brand">
          <div className="ec-brand-mark"><Building2 size={20} /></div>
          <div><strong>Project Control</strong><span>Document & Commercial</span></div>
        </div>
        <div className="ec-project-pill">
          <span>Enterprise Workspace</span>
          <small>Multi-company project control</small>
        </div>
        <nav className="ec-nav">
          {navItems.map((item) => {
            const Icon = resolveIcon(item.navIcon);
            return (
              <NavLink
                key={item.featureCode}
                to={item.route ?? '#'}
                end={item.route === '/control'}
                className={({ isActive }) => `ec-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} /><span>{item.navLabel}</span>
              </NavLink>
            );
          })}
        </nav>
        <button className="ec-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={17} /> Existing CRM
        </button>
      </aside>
      <main className="ec-main"><Outlet /></main>
    </div>
  );
}
