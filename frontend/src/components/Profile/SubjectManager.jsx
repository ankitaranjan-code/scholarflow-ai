import { useState } from 'react';
import api from '../../api/client';

export default function SubjectManager({ subjects, studentId, onSubjectsUpdated, showToast }) {
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    
    setLoading(true);
    try {
      await api.addActiveSubject(studentId, newSubject.trim());
      showToast?.('Subject added successfully', 'success');
      setNewSubject('');
      onSubjectsUpdated();
    } catch (err) {
      showToast?.(err.message || 'Failed to add subject', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await api.deleteActiveSubject(studentId, subjectId);
      showToast?.('Subject removed', 'success');
      onSubjectsUpdated();
    } catch (err) {
      showToast?.(err.message || 'Failed to remove subject', 'error');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h3 className="t-h3 text-primary" style={{ marginBottom: '1rem' }}>Manage Subjects</h3>
      <p className="t-muted" style={{ marginBottom: '1.5rem' }}>Add or remove subjects. These will appear in your Weekly Reports.</p>
      
      <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="New subject name..." 
          value={newSubject}
          onChange={e => setNewSubject(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="task-spinner" /> : 'Add'}
        </button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {subjects.map(subj => (
          <span key={subj.id} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '1rem' }}>
            {subj.name}
            <span 
              className="material-symbols-outlined" 
              style={{ fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }} 
              onClick={() => handleDeleteSubject(subj.id)}
            >
              close
            </span>
          </span>
        ))}
        {subjects.length === 0 && <span className="t-muted font-italic">No subjects added.</span>}
      </div>
    </div>
  );
}
