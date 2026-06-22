import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, Calendar,
  Megaphone, BarChart3, Bot, UserPlus,
  CreditCard, Zap, LogOut, User, ChevronUp, Globe,
  TrendingUp, Target, Brain, Wand2, CheckSquare, CalendarDays, Layers, X, FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { logout } from '../../api/httpClient';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { section: 'Main', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inbox', icon: MessageSquare, label: 'Inbox' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/bookings', icon: Calendar, label: 'Bookings' },
  ]},
  { section: 'Marketing', items: [
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ]},
  { section: 'Intelligence', items: [
    { to: '/trends', icon: TrendingUp, label: 'Trends' },
    { to: '/leads', icon: Target, label: 'Leads' },
    { to: '/learning', icon: Brain, label: 'Learning Insights' },
  ]},
  { section: 'Content', items: [
    { to: '/content-studio', icon: Wand2, label: 'Content Studio' },
    { to: '/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  ]},
  { section: 'Connections', items: [
    { to: '/platforms', icon: Layers, label: 'Platform Integrations' },
  ]},
  { section: 'Documents', items: [
    { to: '/documents', icon: FileText, label: 'Document Control' },
  ]},
  { section: 'Settings', items: [
    { to: '/settings/webhook', icon: Globe, label: 'Webhook Setup' },
    { to: '/settings/bot', icon: Bot, label: 'AI Bot Config' },
    { to: '/settings/team', icon: UserPlus, label: 'Team' },
    { to: '/settings/billing', icon: CreditCard, label: 'Billing' },
  ]},
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
    logout();
  };

  const businessInitial = workspace?.name ? workspace.name[0].toUpperCase() : '?';
  const isConnected = workspace?.whatsapp_connected;

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon"><Zap size={20} /></div>
        <div>
          <h1>Jeeva CRM</h1>
          <span>AI WhatsApp Assistant</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* WhatsApp connection status indicator */}
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.75rem', color: isConnected ? 'var(--accent)' : 'var(--orange)',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: isConnected ? 'var(--accent)' : 'var(--orange)',
          flexShrink: 0,
        }} />
        {isConnected ? 'WhatsApp Connected' : 'WhatsApp Not Connected'}
      </div>

      {/* User Footer with dropdown */}
      <div style={{ position: 'relative', borderTop: '1px solid var(--border)' }}>
        {showUserMenu && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: 8, margin: '0 8px 8px',
            boxShadow: 'var(--shadow)',
          }}>
            <button
              onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--radius-xs)',
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <User size={16} /> View Profile
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--radius-xs)',
                background: 'none', border: 'none', color: 'var(--red)',
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-glow)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', background: showUserMenu ? 'var(--bg-card)' : 'none',
            border: 'none', cursor: 'pointer', transition: 'background var(--transition)',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--blue), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.88rem', color: '#fff',
          }}>
            {businessInitial}
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {workspace?.name || 'My Business'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {workspace?.plan || 'starter'} plan
            </div>
          </div>
          <ChevronUp
            size={16}
            color="var(--text-muted)"
            style={{ transform: showUserMenu ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
          />
        </button>
      </div>
    </aside>
  );
}
