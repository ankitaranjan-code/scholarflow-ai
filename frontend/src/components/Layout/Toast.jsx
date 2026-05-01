/**
 * Toast — A notification popup for feedback on actions
 * (task completion, badge unlocks, errors).
 */
import './Toast.css';

export default function Toast({ message, type = 'success', onClose }) {
  const icons = {
    success: '✅',
    error: '❌',
    badge: '🏆',
    points: '⭐',
  };

  return (
    <div className={`toast toast-${type} animate-fade-in`} onClick={onClose}>
      <span className="toast-icon">{icons[type] || '✅'}</span>
      <span className="toast-msg">{message}</span>
    </div>
  );
}
