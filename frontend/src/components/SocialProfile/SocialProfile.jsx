/**
 * SocialProfile — Public-facing profile card with badges,
 * streak info, and a "Cheer" interaction button.
 * Now calls the backend cheer API.
 */
import { useState } from 'react';
import api from '../../api/client';
import './SocialProfile.css';

const rarityColors = {
  common: 'var(--on-surface-variant)',
  rare: 'var(--primary)',
  epic: 'var(--secondary)',
  legendary: 'var(--warning)',
};

export default function SocialProfile({ student, badges, cheerCount: initialCheers, showToast }) {
  const [cheers, setCheers] = useState(initialCheers);
  const [cheered, setCheered] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);
  const displayBadges = showAll ? badges : earnedBadges.slice(0, 6);

  const handleCheer = async () => {
    if (cheered) return;
    setCheers(c => c + 1);
    setCheered(true);

    try {
      await api.sendCheer(student.id || 1, '🎉 Keep it up!');
      showToast?.('Cheer sent! 🎉', 'success');
    } catch (err) {
      console.warn('Cheer API failed:', err.message);
    }
  };

  return (
    <div className="social-profile animate-fade-in">
      {/* Profile Header Card */}
      <div className="profile-hero glass-card">
        <div className="profile-hero-bg" />
        <div className="profile-avatar-lg">
          <span className="avatar-initial-lg font-headline">
            {(student.displayName || student.display_name || 'S').charAt(0)}
          </span>
          <div className="profile-level-badge">{student.level ?? 1}</div>
        </div>
        <h2 className="t-h2" style={{ marginTop: '0.75rem' }}>
          {student.displayName || student.display_name}
        </h2>
        <p className="t-muted" style={{ marginTop: '0.25rem' }}>@{student.username}</p>
        <p className="profile-bio">{student.bio}</p>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="stat-val font-headline">
              {(student.totalPoints ?? student.total_points ?? 0).toLocaleString()}
            </span>
            <span className="stat-label">Points</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="stat-val font-headline text-tertiary">
              {student.currentStreak ?? student.current_streak ?? 0}
            </span>
            <span className="stat-label">Streak 🔥</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="stat-val font-headline text-secondary">{earnedBadges.length}</span>
            <span className="stat-label">Badges</span>
          </div>
        </div>

        <div className="profile-actions">
          <button
            className={`btn cheer-btn ${cheered ? 'cheered' : ''}`}
            onClick={handleCheer}
            id="cheer-button"
          >
            <span>{cheered ? '🎉' : '👏'}</span>
            <span>{cheered ? 'Cheered!' : 'Send Cheer'}</span>
            <span className="cheer-count">{cheers}</span>
          </button>
        </div>
      </div>

      {/* Badge Collection */}
      <div className="badges-section">
        <div className="badges-header">
          <h3 className="t-h3">Badge Collection</h3>
          <button className="btn-ghost t-small" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Earned' : 'Show All'}
          </button>
        </div>
        <div className="badges-grid">
          {displayBadges.map((badge) => (
            <div
              key={badge.id}
              className={`badge-card ${badge.earned ? '' : 'badge-locked'}`}
              title={badge.earned ? `Earned: ${badge.earnedAt}` : 'Not yet earned'}
            >
              <span className="badge-emoji">{badge.emoji}</span>
              <span className="badge-name">{badge.name}</span>
              <span className="badge-rarity" style={{ color: rarityColors[badge.rarity] }}>
                {badge.rarity}
              </span>
              {!badge.earned && <div className="badge-lock-overlay">🔒</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
