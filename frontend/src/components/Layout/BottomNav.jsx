/**
 * BottomNav — Mobile-first bottom navigation bar.
 * Four tabs: Growth (Dashboard), AI (Chat), Routine (Profile), Focus.
 */
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

export default function BottomNav({ activeTab, onTabChange }) {
  const { user } = useAuth();

  const tabs = [
    { id: 'dashboard', icon: 'insights', label: 'Growth' },
    { id: 'academics', icon: 'school', label: 'Academics' },
    { id: 'chat', icon: 'auto_awesome', label: 'AI Chat' },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ];

  if (user?.is_admin) {
    tabs.push({ id: 'admin', icon: 'admin_panel_settings', label: 'Admin' });
  }

  return (
    <nav className="bottom-nav" id="main-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`nav-${tab.id}`}
          className={`nav-item ${activeTab === tab.id ? 'nav-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <span className="material-symbols-outlined nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
          {activeTab === tab.id && <span className="nav-indicator" />}
        </button>
      ))}
    </nav>
  );
}
