import { useState } from 'react';
import './RoutineManagement.css';

export default function RoutineManagement({ currentTasks, onSave, onCancel, loading }) {
  const [tasks, setTasks] = useState(currentTasks || []);
  const [newTask, setNewTask] = useState({ title: '', category: 'study', time_slot: '08:00', points_value: 20 });

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks([...tasks, { ...newTask, id: Date.now() }]);
    setNewTask({ title: '', category: 'study', time_slot: '08:00', points_value: 20 });
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSave = () => {
    onSave(tasks);
  };

  return (
    <div className="routine-mgmt-overlay animate-fade-in">
      <div className="glass-card routine-mgmt-modal">
        <div className="mgmt-header">
          <h3 className="t-h3">Customize Your Routine</h3>
          <p className="t-muted">Set up the tasks you want to track daily.</p>
        </div>

        <div className="task-editor">
          <div className="add-task-row">
            <input
              type="text"
              className="input-field"
              placeholder="Task title (e.g. Morning Walk)"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            />
            <select
              className="input-field"
              value={newTask.category}
              onChange={e => setNewTask({ ...newTask, category: e.target.value })}
              style={{ width: 'auto' }}
            >
              <option value="study">Study</option>
              <option value="wellness">Wellness</option>
              <option value="personal">Personal</option>
              <option value="social">Social</option>
            </select>
            <input
              type="time"
              className="input-field"
              value={newTask.time_slot}
              onChange={e => setNewTask({ ...newTask, time_slot: e.target.value })}
              style={{ width: 'auto' }}
            />
            <button className="btn btn-primary" onClick={addTask}>
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div className="mgmt-task-list">
            {tasks.length === 0 && <p className="t-muted" style={{ textAlign: 'center', padding: '1rem' }}>No tasks added yet.</p>}
            {tasks.map((task) => (
              <div key={task.id} className="mgmt-task-item">
                <span className="material-symbols-outlined text-primary">
                  {task.category === 'study' ? 'menu_book' : task.category === 'wellness' ? 'fitness_center' : 'check_circle'}
                </span>
                <div className="mgmt-task-info">
                  <p className="t-body" style={{ fontWeight: 600 }}>{task.title}</p>
                  <p className="t-small text-muted">{task.time_slot} • {task.category}</p>
                </div>
                <button className="btn-ghost text-error" onClick={() => removeTask(task.id)}>
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mgmt-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="task-spinner" /> : 'Save Routine'}
          </button>
        </div>
      </div>
    </div>
  );
}
