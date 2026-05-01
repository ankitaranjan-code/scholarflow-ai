import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import './Leaderboard.css';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        setLeaders(data);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className="leaderboard-card glass-card skeleton" style={{ height: '300px' }} />;
  }

  return (
    <div className="leaderboard-card glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="leaderboard-header">
        <h3 className="t-h3">Global Leaderboard</h3>
        <p className="t-muted t-small">Top Scholars by Points</p>
      </div>

      <div className="leaderboard-list">
        {leaders.map((leader, idx) => (
          <div
            key={leader.id}
            className={`leaderboard-item ${user?.id === leader.id ? 'is-current-user' : ''}`}
          >
            <div className="leader-rank">
              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
            </div>
            <div className="leader-info">
              <span className="leader-name">{leader.display_name}</span>
              <span className="leader-level text-secondary">Lv. {leader.level}</span>
            </div>
            <div className="leader-stats">
              <span className="leader-streak text-tertiary">🔥 {leader.current_streak}</span>
              <span className="leader-points font-headline text-primary">{leader.total_points.toLocaleString()}</span>
            </div>
          </div>
        ))}
        {leaders.length === 0 && (
          <div className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No data available</div>
        )}
      </div>
    </div>
  );
}
