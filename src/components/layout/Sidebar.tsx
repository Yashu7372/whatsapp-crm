import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, Calendar,
  Megaphone, BarChart3, Bot, UserPlus,
  CreditCard, Zap, LogOut, User, ChevronUp,
  Globe, X, Wifi, WifiOff, FileText, Image,
  TrendingUp, Video, Clock, HardDrive, Share2,
} from 'lucide-react';
import { crmApi, type Workspace } from '../../api/crmApi';
import { logout } from '../../api/httpClient';
import { useFeatures } from '../../contexts/FeaturesContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isEnabled } = useFeatures();

  useEffect(() => {
    crmApi.getWorkspace().then(setWorkspace).catch(() => {});
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const initial = workspace?.name?.[0]?.toUpperCase() ?? '?';
  const isConnected = workspace?.whatsappConnected;

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

        <div className="nav-section">
          <p className="nav-section-title">Main</p>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={18} className="nav-icon" /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/inbox" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <MessageSquare size={18} className="nav-icon" /><span>Inbox</span>
          </NavLink>
          <NavLink to="/contacts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Users size={18} className="nav-icon" /><span>Contacts</span>
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Calendar size={18} className="nav-icon" /><span>Bookings</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-section-title">Marketing</p>
          {isEnabled('CAMPAIGNS') && (
            <NavLink to="/campaigns" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Megaphone size={18} className="nav-icon" /><span>Campaigns</span>
            </NavLink>
          )}
          <NavLink to="/analytics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <BarChart3 size={18} className="nav-icon" /><span>Analytics</span>
          </NavLink>
        </div>

        {(isEnabled('DOCUMENT_CONTROL') || isEnabled('MEDIA_LIBRARY') ||
          isEnabled('AI_TREND_PICKER') || isEnabled('AI_CONTENT_GENERATOR') ||
          isEnabled('VIDEO_TEMPLATE_ENGINE') || isEnabled('SCHEDULED_PUBLISHING')) && (
          <div className="nav-section">
            <p className="nav-section-title">Content</p>
            {isEnabled('DOCUMENT_CONTROL') && (
              <NavLink to="/documents" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <FileText size={18} className="nav-icon" /><span>Documents</span>
              </NavLink>
            )}
            {isEnabled('MEDIA_LIBRARY') && (
              <NavLink to="/media-library" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Image size={18} className="nav-icon" /><span>Media Library</span>
              </NavLink>
            )}
            {isEnabled('AI_TREND_PICKER') && (
              <NavLink to="/trends" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <TrendingUp size={18} className="nav-icon" /><span>AI Trends</span>
              </NavLink>
            )}
            {isEnabled('AI_CONTENT_GENERATOR') && (
              <NavLink to="/content-studio" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Zap size={18} className="nav-icon" /><span>Content Studio</span>
              </NavLink>
            )}
            {isEnabled('VIDEO_TEMPLATE_ENGINE') && (
              <NavLink to="/video-generator" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Video size={18} className="nav-icon" /><span>Video Generator</span>
              </NavLink>
            )}
            {isEnabled('SCHEDULED_PUBLISHING') && (
              <NavLink to="/calendar" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Clock size={18} className="nav-icon" /><span>Content Calendar</span>
              </NavLink>
            )}
          </div>
        )}

        <div className="nav-section">
          <p className="nav-section-title">Settings</p>
          <NavLink to="/settings/webhook" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Globe size={18} className="nav-icon" /><span>Webhook Setup</span>
          </NavLink>
          <NavLink to="/settings/bot" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Bot size={18} className="nav-icon" /><span>AI Bot Config</span>
          </NavLink>
          <NavLink to="/settings/team" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <UserPlus size={18} className="nav-icon" /><span>Team</span>
          </NavLink>
          {isEnabled('SCHEDULED_PUBLISHING') && (
            <NavLink to="/settings/social" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Share2 size={18} className="nav-icon" /><span>Social Accounts</span>
            </NavLink>
          )}
          {(isEnabled('MEDIA_LIBRARY') || isEnabled('DOCUMENT_CONTROL')) && (
            <NavLink to="/settings/storage" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <HardDrive size={18} className="nav-icon" /><span>Storage</span>
            </NavLink>
          )}
          <NavLink to="/settings/billing" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <CreditCard size={18} className="nav-icon" /><span>Billing</span>
          </NavLink>
        </div>

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
