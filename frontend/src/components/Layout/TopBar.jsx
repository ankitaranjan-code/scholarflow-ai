/**
 * TopBar — The header bar with branding, points badge, and notification icon.
 * Now pulls live data from StudentContext.
 */
import { useEffect } from 'react';
import { useStudent } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import { studentProfile } from '../../data/mockData';
import './TopBar.css';

export default function TopBar() {
  const { student, fetchStudent } = useStudent();
  const { logout } = useAuth();

  const displayStudent = student || studentProfile;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <div className="topbar-avatar">
            {displayStudent.avatar_url ? (
              <img src={displayStudent.avatar_url} alt={displayStudent.display_name || displayStudent.displayName} />
            ) : (
              <span className="avatar-initial">
                {(displayStudent.display_name || displayStudent.displayName || 'S').charAt(0)}
              </span>
            )}
            <span className="avatar-status-dot" />
          </div>
          <h1 className="topbar-brand font-headline">ScholarFlow AI</h1>
        </div>
        <div className="topbar-right">
          <span className="points-badge">
            <span className="points-icon">⭐</span>
            <span className="points-value">
              {(displayStudent.total_points ?? displayStudent.totalPoints ?? 0).toLocaleString()}
            </span>
          </span>
          <button className="btn-icon" id="notifications-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="notif-dot" />
          </button>
          <button className="btn-icon" id="logout-btn" aria-label="Logout" onClick={logout} style={{ marginLeft: '0.5rem' }}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
