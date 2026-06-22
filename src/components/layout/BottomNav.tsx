import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Users, Megaphone, Menu } from 'lucide-react';

interface BottomNavProps {
  onMenuClick: () => void;
}

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/inbox', icon: MessageSquare, label: 'Inbox' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
];

export default function BottomNav({ onMenuClick }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {navLinks.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
      <button className="bottom-nav-item" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
        <span>More</span>
      </button>
    </nav>
  );
}
