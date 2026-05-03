/**
 * RoutineTracker — Daily checklist with completion toggles,
 * progress ring, point awards, and edit/delete controls.
 * Now optionally calls the backend API for task completion.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import mascotImg from '../../assets/mascot.png';
import './RoutineTracker.css';

export default function RoutineTracker({ tasks: initialTasks, totalPoints, studentId, onTaskComplete, onSetupClick, onRoutineDeleted }) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [completing, setCompleting] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deletingRoutine, setDeletingRoutine] = useState(false);

  useEffect(() => {
    setTasks(initialTasks || []);
  }, [initialTasks]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const earnedToday = tasks.filter(t => t.completed).reduce((s, t) => s + t.points, 0);
  const circumference = 2 * Math.PI * 42;
  const strokeDash = (completionPct / 100) * circumference;

  // Get routineId from the first task (all tasks share the same routine)
  const routineId = tasks.length > 0 ? tasks[0].routineId : null;

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed || editMode) return;

    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: true } : t
    ));

    if (studentId && onTaskComplete) {
      setCompleting(id);
      try {
        const result = await api.completeTask(studentId, id);
        onTaskComplete(id, result.points_earned, result.badge_unlocked);
      } catch (err) {
        console.warn('Task completion API call failed, using local state:', err.message);
        onTaskComplete(id, task.points, null);
      } finally {
        setCompleting(null);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!studentId || !routineId) return;
    setDeletingTask(taskId);
    try {
      await api.deleteTask(studentId, routineId, taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err.message);
    } finally {
      setDeletingTask(null);
    }
  };

  const handleDeleteRoutine = async () => {
    if (!studentId || !routineId) return;
    setDeletingRoutine(true);
    try {
      await api.deleteRoutine(studentId, routineId);
      setTasks([]);
      setEditMode(false);
      onRoutineDeleted?.();
    } catch (err) {
      console.error('Failed to delete routine:', err.message);
    } finally {
      setDeletingRoutine(false);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p className="t-eyebrow text-tertiary" style={{ margin: 0 }}>Daily Routine</p>
            {onSetupClick && (
              <button 
                onClick={onSetupClick} 
                className="btn-icon" 
                style={{ width: '24px', height: '24px', padding: 0 }}
                title="Setup Routine"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>settings</span>
              </button>
            )}
            {tasks.length > 0 && (
              <button 
                onClick={() => setEditMode(!editMode)} 
                className="btn-icon" 
                style={{ 
                  width: '24px', height: '24px', padding: 0,
                  color: editMode ? 'var(--error)' : undefined
                }}
                title={editMode ? 'Done Editing' : 'Edit Routine'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                  {editMode ? 'check' : 'edit'}
                </span>
              </button>
            )}
          </div>
          <h3 className="t-h3" style={{ margin: 0 }}>Today's Checklist</h3>
        </div>
        
        {tasks.length > 0 && !editMode && (
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
        )}
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="edit-mode-banner">
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>info</span>
          <span className="t-small">Tap the <b>🗑️</b> icon to remove a task.</span>
        </div>
      )}

      <div className="routine-points-bar">
        <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '1.125rem' }}>stars</span>
        <span className="t-small" style={{ color: 'var(--warning)', fontWeight: 600 }}>+{earnedToday} pts today</span>
        <span className="t-small text-muted" style={{ marginLeft: 'auto' }}>Total: {totalPoints.toLocaleString()}</span>
      </div>

      {tasks.length > 0 ? (
        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className={`task-item-wrap ${editMode ? 'editing' : ''}`}>
              <button
                className={`task-item ${task.completed ? 'task-done' : ''} ${completing === task.id ? 'task-completing' : ''}`}
                onClick={() => toggleTask(task.id)}
                disabled={task.completed || completing === task.id || editMode}
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
                <span className="material-symbols-outlined task-icon" style={{ color: categoryColors[task.category] || 'var(--text-muted)' }}>
                  {task.icon}
                </span>
              </button>
              
              {/* Delete button (visible in edit mode) */}
              {editMode && (
                <button
                  className="task-delete-btn"
                  onClick={() => handleDeleteTask(task.id)}
                  disabled={deletingTask === task.id}
                  title="Delete this task"
                >
                  {deletingTask === task.id ? (
                    <span className="task-spinner" />
                  ) : (
                    <span className="material-symbols-outlined">delete</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={mascotImg} alt="Mascot" className="sticker animate-float" style={{ width: '120px', marginBottom: '1rem' }} />
          <p className="t-muted">Your daily routine is currently empty.</p>
          {onSetupClick && (
            <button className="btn btn-secondary mt-2" onClick={onSetupClick} style={{ margin: '0.5rem auto 0' }}>
              Setup Routine
            </button>
          )}
        </div>
      )}

      {/* Edit mode footer with delete-all and create-new */}
      {editMode && tasks.length > 0 && (
        <div className="edit-mode-footer">
          <button 
            className="btn btn-error-outline" 
            onClick={handleDeleteRoutine}
            disabled={deletingRoutine}
          >
            {deletingRoutine ? (
              <span className="task-spinner" />
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete_sweep</span>
                Delete Entire Routine
              </>
            )}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditMode(false); onSetupClick?.(); }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Create New Routine
          </button>
        </div>
      )}

      {tasks.length > 0 && completionPct === 100 && !editMode && (
        <div className="routine-complete-banner animate-breathe">
          <span>🎉</span>
          <span className="font-headline">Perfect Day! All tasks completed!</span>
        </div>
      )}
    </div>
  );
}
