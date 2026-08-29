import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Zap, LogOut, User, ChevronUp, X, Wifi, WifiOff,
} from 'lucide-react';
import { crmApi, type Workspace } from '../../api/crmApi';
import { logout } from '../../api/httpClient';
import { useNav } from '../../contexts/NavContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconRegistry = LucideIcons as unknown as Record<string, LucideIcon>;

function resolveIcon(name: string | null): LucideIcon {
  return (name && iconRegistry[name]) || LucideIcons.Circle;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { items } = useNav();

  useEffect(() => {
    crmApi.getWorkspace().then(setWorkspace).catch(() => {});
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const initial = workspace?.name?.[0]?.toUpperCase() ?? '?';
  const isConnected = workspace?.whatsappConnected;

  // The nav API already scopes items to what this tenant is entitled to and
  // this user's role may see — the sidebar just groups and renders them.
  // Items with no navSection (e.g. Project Control sub-pages) belong to
  // EnterpriseLayout's own nav, not the main sidebar.
  const sections = new Map<string, typeof items>();
  for (const item of items) {
    if (!item.navSection) continue;
    if (!sections.has(item.navSection)) sections.set(item.navSection, []);
    sections.get(item.navSection)!.push(item);
  }
  const sectionDisplayOrder = ['Main', 'Enterprise', 'Marketing', 'Content', 'Settings'];
  const orderedSections = [...sections.entries()].sort(
    ([a], [b]) => sectionDisplayOrder.indexOf(a) - sectionDisplayOrder.indexOf(b)
  );

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>

      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={18} />
        </div>
        <div className="logo-text">
          <h1>Jeeva CRM</h1>
          <span>AI WhatsApp Assistant</span>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={17} />
        </button>
      </div>

      {/* ── Navigation (driven entirely by GET /api/v1/me/nav) ──────── */}
      <nav className="sidebar-nav">
        {orderedSections.map(([section, sectionItems]) => (
          <div className="nav-section" key={section}>
            <p className="nav-section-title">{section}</p>
            {sectionItems.map((item) => {
              const Icon = resolveIcon(item.navIcon);
              return (
                <NavLink
                  key={item.featureCode}
                  to={item.route ?? '#'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={18} className="nav-icon" /><span>{item.navLabel}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── WhatsApp connection status ────────────────────── */}
      <div className="sidebar-status">
        {isConnected
          ? <Wifi size={13} />
          : <WifiOff size={13} />}
        <span>{isConnected ? 'WhatsApp Connected' : 'Not Connected'}</span>
        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
      </div>

      {/* ── User footer ───────────────────────────────────── */}
      <div className="sidebar-user-footer">
        {showUserMenu && (
          <div className="user-menu-popup">
            <button
              className="user-menu-item"
              onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
            >
              <User size={15} />
              View Profile
            </button>
            <button
              className="user-menu-item danger"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        )}

        <button
          className={`user-trigger${showUserMenu ? ' open' : ''}`}
          onClick={() => setShowUserMenu(v => !v)}
          aria-expanded={showUserMenu}
          aria-label="User menu"
        >
          <div className="user-avatar">{initial}</div>
          <div className="user-info">
            <span className="user-name">{workspace?.name || 'My Business'}</span>
            <span className="user-plan">{workspace?.plan ?? 'starter'} plan</span>
          </div>
          <ChevronUp
            size={15}
            className={`chevron${showUserMenu ? '' : ' flipped'}`}
          />
        </button>
      </div>
    </aside>
  );
}
