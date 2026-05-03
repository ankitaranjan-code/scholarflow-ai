import { useState } from 'react';
import api from '../../api/client';
import './RoutineSetupModal.css';

const CATEGORY_ICONS = {
  study: 'menu_book',
  wellness: 'self_improvement',
  personal: 'edit_note',
  social: 'group',
};

export default function RoutineSetupModal({ isOpen, onClose, onSave, studentId, activeSubjects }) {
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual Form State
  const [tasks, setTasks] = useState([]);
  const [routineName, setRoutineName] = useState('My Custom Routine');
  
  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('08:00');
  const [newTaskCategory, setNewTaskCategory] = useState('study');
  
  // AI Form State
  const [description, setDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState(null);

  if (!isOpen) return null;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      title: newTaskTitle.trim(),
      timeSlot: newTaskTime,
      category: newTaskCategory,
      points: 15,
      icon: CATEGORY_ICONS[newTaskCategory] || 'menu_book',
    };
    setTasks([...tasks, newTask]);
    // Reset the form for next task
    setNewTaskTitle('');
    setNewTaskTime('08:00');
    setNewTaskCategory('study');
  };

  const handleRemoveTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleAIGenerate = async () => {
    if (!description.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await api.generateRoutine(description);
      if (response && response.tasks) {
        setTasks(response.tasks);
        setRoutineName('AI Generated Routine');
        setActiveTab('manual'); // switch to manual tab to let them edit it before saving
      }
    } catch (err) {
      setAiError(err.message || 'Failed to generate routine. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    const validTasks = tasks.filter(t => t.title.trim() !== '');
    if (validTasks.length === 0) return;
    
    setSaving(true);
    try {
      // Map frontend field names to backend schema field names
      const backendTasks = validTasks.map(t => ({
        title: t.title,
        category: t.category || 'study',
        icon_name: t.icon || t.icon_name || 'check_circle',
        points_value: t.points || t.points_value || 15,
        time_slot: t.timeSlot || t.time_slot || '',
      }));

      const newRoutine = await api.createRoutine(studentId, {
        name: routineName,
        description: 'Custom daily schedule',
        tasks: backendTasks
      });
      onSave(newRoutine);
      onClose();
    } catch (err) {
      console.error('Failed to save routine:', err);
    } finally {
      setSaving(false);
    }
  };

  // Format time for display (e.g. "08:00" -> "8:00 AM")
  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const categoryColors = {
    study: 'var(--primary)',
    wellness: 'var(--tertiary)',
    personal: 'var(--secondary)',
    social: 'var(--warning)',
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content routine-modal glass-card">
        <div className="modal-header">
          <h2 className="t-h2">Setup Your Routine</h2>
          <button className="btn-icon" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>Manual Setup</button>
          <button className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>AI Suggestion</button>
        </div>

        <div className="modal-body">
          {activeTab === 'manual' ? (
            <div className="manual-setup animate-fade-in">
              <div className="input-group">
                <label className="input-label">Routine Name</label>
                <input 
                  className="input-field" 
                  value={routineName} 
                  onChange={e => setRoutineName(e.target.value)} 
                />
              </div>

              {/* Add New Task Form */}
              <div className="add-task-form">
                <label className="input-label" style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>add_circle</span>
                  Add a Task
                </label>
                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                  <input 
                    className="input-field"
                    placeholder="What do you want to do? (e.g. Morning Meditation, Study Math, Gym...)"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
                    style={{ fontSize: '1rem' }}
                  />
                </div>
                <div className="add-task-options">
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label t-small">Time</label>
                    <input 
                      type="time"
                      className="input-field" 
                      value={newTaskTime}
                      onChange={e => setNewTaskTime(e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label t-small">Category</label>
                    <select 
                      className="input-field" 
                      value={newTaskCategory}
                      onChange={e => setNewTaskCategory(e.target.value)}
                    >
                      <option value="study">📚 Study</option>
                      <option value="wellness">🧘 Wellness</option>
                      <option value="personal">✏️ Personal</option>
                      <option value="social">👥 Social</option>
                    </select>
                  </div>
                  <button 
                    className="btn btn-primary add-task-btn" 
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    title="Add Task"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span>
                    Add
                  </button>
                </div>
              </div>

              {/* Task List */}
              {tasks.length > 0 && (
                <div className="tasks-list-section">
                  <label className="input-label" style={{ marginBottom: '0.5rem' }}>
                    Your Tasks ({tasks.length})
                  </label>
                  <div className="tasks-container">
                    {tasks.map((task, idx) => (
                      <div key={idx} className="task-card">
                        <div className="task-card-left">
                          <span 
                            className="material-symbols-outlined task-card-icon" 
                            style={{ color: categoryColors[task.category] || 'var(--primary)' }}
                          >
                            {CATEGORY_ICONS[task.category] || task.icon || 'menu_book'}
                          </span>
                          <div className="task-card-info">
                            <span className="task-card-title">{task.title}</span>
                            <span className="task-card-meta">
                              <span className="task-card-time">{formatTime(task.timeSlot)}</span>
                              <span className="task-card-cat">{task.category}</span>
                            </span>
                          </div>
                        </div>
                        <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleRemoveTask(idx)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tasks.length === 0 && (
                <div className="empty-tasks-hint">
                  <span className="material-symbols-outlined text-muted" style={{ fontSize: '2.5rem' }}>checklist</span>
                  <p className="t-muted">No tasks added yet. Use the form above to add your daily tasks.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="ai-setup animate-fade-in">
              <p className="t-muted mb-2">
                Describe your day and what you want to achieve. ScholarFlow AI will generate a structured schedule for you.
              </p>
              <textarea 
                className="input-field" 
                rows="4"
                placeholder="Example: I wake up at 6am. I want to study math for 2 hours in the morning, go to gym at 5pm, and do chemistry revision at night..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {aiError && <p style={{ color: 'var(--error)', marginTop: '0.5rem' }}>{aiError}</p>}
              <button className="btn btn-primary mt-2" onClick={handleAIGenerate} disabled={aiLoading || !description.trim()}>
                {aiLoading ? <span className="task-spinner" /> : 'Generate Routine'}
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || tasks.length === 0}>
            {saving ? 'Saving...' : `Apply Routine (${tasks.length} tasks)`}
          </button>
        </div>
      </div>
    </div>
  );
}
