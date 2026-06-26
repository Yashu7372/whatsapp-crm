import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, Calendar,
  Megaphone, BarChart3, Bot, UserPlus,
  CreditCard, Zap, LogOut, User, ChevronUp,
  Globe, X, Wifi, WifiOff,
} from 'lucide-react';
import { api } from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    section: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/inbox',     icon: MessageSquare,   label: 'Inbox'     },
      { to: '/contacts',  icon: Users,           label: 'Contacts'  },
      { to: '/bookings',  icon: Calendar,        label: 'Bookings'  },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { to: '/settings/webhook', icon: Globe,    label: 'Webhook Setup' },
      { to: '/settings/bot',     icon: Bot,      label: 'AI Bot Config' },
      { to: '/settings/team',    icon: UserPlus, label: 'Team'          },
      { to: '/settings/billing', icon: CreditCard, label: 'Billing'     },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    api.getWorkspace().then(setWorkspace).catch(() => {});
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    navigate('/onboarding');
  };

  const initial = workspace?.name?.[0]?.toUpperCase() ?? '?';
  const isConnected = workspace?.whatsapp_connected;

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

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="sidebar-nav">
        {navItems.map(({ section, items }) => (
          <div className="nav-section" key={section}>
            <p className="nav-section-title">{section}</p>
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                <span>{label}</span>
              </NavLink>
            ))}
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
