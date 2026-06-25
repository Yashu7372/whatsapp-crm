import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inbox': 'Inbox',
  '/contacts': 'Contacts',
  '/bookings': 'Bookings',
  '/campaigns': 'Campaigns',
  '/analytics': 'Analytics',
  '/settings/bot': 'AI Bot Config',
  '/settings/team': 'Team',
  '/settings/billing': 'Billing',
  '/settings/webhook': 'Webhook Setup',
  '/profile': 'Profile',
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <header className="header">
      {/* ── Left: Hamburger (mobile) + Logo (mobile) + Title (desktop) ── */}
      <div className="header-left">
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Brand mark shown only on mobile (sidebar is hidden) */}
        <div className="header-brand">
          <div className="header-brand-icon">
            <span>J</span>
          </div>
          <span className="header-brand-name">Jeeva CRM</span>
        </div>

        {/* Page title shown on desktop */}
        <h2 className="header-title">{title}</h2>
      </div>

      {/* ── Right: Search, theme, notifications ── */}
      <div className="header-right">
        {/* Desktop search box */}
        <div className="search-box header-search-desktop">
          <Search size={15} />
          <input type="text" placeholder="Search contacts, messages…" />
        </div>

        {/* Mobile: search icon toggles an inline search */}
        <button
          className="icon-btn header-search-mobile-btn"
          title="Search"
          onClick={() => setSearchOpen(o => !o)}
          aria-label="Toggle search"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        <button
          className="icon-btn"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDarkMode(d => !d)}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="icon-btn" title="Notifications" aria-label="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
      </div>

      {/* Mobile expanded search bar (slides down below header) */}
      {searchOpen && (
        <div className="header-search-mobile-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search contacts, messages…"
            autoFocus
          />
        </div>
      )}
    </header>
  );
}
