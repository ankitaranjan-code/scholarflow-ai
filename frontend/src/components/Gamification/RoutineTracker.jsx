/**
 * RoutineTracker — Daily checklist with completion toggles,
 * progress ring, and point awards.
 * Now optionally calls the backend API for task completion.
 */
import { useState } from 'react';
import api from '../../api/client';
import './RoutineTracker.css';

export default function RoutineTracker({ tasks: initialTasks, totalPoints, studentId, onTaskComplete }) {
  // Normalize task shape: backend uses points_value/icon_name/is_completed_today
  const normalize = (t) => ({
    ...t,
    points: t.points ?? t.points_value ?? 0,
    icon: t.icon ?? t.icon_name ?? 'check_circle',
    completed: t.completed ?? t.is_completed_today ?? false,
    timeSlot: t.timeSlot ?? t.time_slot ?? '',
  });

  const [tasks, setTasks] = useState((initialTasks || []).map(normalize));
  const [completing, setCompleting] = useState(null);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length || 1;
  const completionPct = Math.round((completedCount / totalCount) * 100);
  const earnedToday = tasks.filter(t => t.completed).reduce((s, t) => s + t.points, 0);
  const circumference = 2 * Math.PI * 42;
  const strokeDash = (completionPct / 100) * circumference;

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return; // Don't allow un-completing

    // Optimistic UI update
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: true } : t
    ));

    // Try API call if studentId is available
    if (studentId && onTaskComplete) {
      setCompleting(id);
      try {
        const result = await api.completeTask(studentId, id);
        onTaskComplete(id, result.points_earned, result.badge_unlocked);
      } catch (err) {
        // API failed — still keep local state (task was already toggled)
        console.warn('Task completion API call failed, using local state:', err.message);
        onTaskComplete(id, task.points, null);
      } finally {
        setCompleting(null);
      }
    }
  };

  const categoryColors = {
    study: 'var(--primary)',
    wellness: 'var(--tertiary)',
    personal: 'var(--secondary)',
    social: 'var(--warning)',
  };

  return (
    <div className="routine-tracker animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="routine-header">
        <div>
          <p className="t-eyebrow text-tertiary">Daily Routine</p>
          <h3 className="t-h3" style={{ marginTop: '0.25rem' }}>Today's Checklist</h3>
        </div>
        <div className="routine-ring-wrap">
          <svg className="routine-ring" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--surface-mid)" strokeWidth="5" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--tertiary)" strokeWidth="5"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round" transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          </svg>
          <div className="routine-ring-label">
            <span className="ring-pct font-headline">{completionPct}%</span>
            <span className="ring-sub">{completedCount}/{totalCount}</span>
          </div>
        </div>
      </div>

      <div className="routine-points-bar">
        <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '1.125rem' }}>stars</span>
        <span className="t-small" style={{ color: 'var(--warning)', fontWeight: 600 }}>+{earnedToday} pts today</span>
        <span className="t-small text-muted" style={{ marginLeft: 'auto' }}>Total: {totalPoints.toLocaleString()}</span>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <button
            key={task.id}
            className={`task-item ${task.completed ? 'task-done' : ''} ${completing === task.id ? 'task-completing' : ''}`}
            onClick={() => toggleTask(task.id)}
            disabled={task.completed || completing === task.id}
            id={`task-${task.id}`}
          >
            <div className={`task-check ${task.completed ? 'task-checked' : ''}`}>
              {task.completed && <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>}
              {completing === task.id && <span className="task-spinner" />}
            </div>
            <div className="task-info">
              <span className="task-title">{task.title}</span>
              <span className="task-meta">
                <span className="task-time">{task.timeSlot}</span>
                <span className="task-pts">+{task.points}</span>
              </span>
            </div>
            <span className="material-symbols-outlined task-icon"
                  style={{ color: categoryColors[task.category] || 'var(--text-muted)' }}>
              {task.icon}
            </span>
          </button>
        ))}
      </div>

      {completionPct === 100 && (
        <div className="routine-complete-banner animate-breathe">
          <span>🎉</span>
          <span className="font-headline">Perfect Day! All tasks completed!</span>
        </div>
      )}
    </div>
  );
}
