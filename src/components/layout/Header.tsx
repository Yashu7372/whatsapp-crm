import { useLocation } from 'react-router-dom';
import { Search, Bell, Moon } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inbox': 'Inbox',
  '/contacts': 'Contacts',
  '/bookings': 'Bookings',
  '/campaigns': 'Campaigns',
  '/analytics': 'Analytics',
  '/settings/bot': 'AI Bot Configuration',
  '/settings/team': 'Team Management',
  '/settings/billing': 'Billing & Plans',
  '/settings/webhook': 'Webhook Setup',
  '/profile': 'Profile',
  '/trends': 'Trend Intelligence',
  '/leads': 'Lead Intelligence',
  '/learning': 'Learning Insights',
  '/content-studio': 'Content Studio',
  '/approvals': 'Approval Queue',
  '/calendar': 'Content Calendar',
  '/platforms': 'Platform Integrations',
  '/documents': 'Document Control',
};

export default function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="header">
      <div className="header-left">
        <h2>{title}</h2>
      </div>
      <div className="header-right">
        <div className="search-box">
          <Search size={16} color="#64748b" />
          <input type="text" placeholder="Search contacts, messages..." />
        </div>
        <button className="icon-btn" title="Toggle theme">
          <Moon size={18} />
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  );
}
