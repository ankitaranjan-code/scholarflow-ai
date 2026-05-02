import { useState } from 'react';
import './DataEntryModal.css';

const DEFAULT_SUBJECTS = [
  { subject_name: 'Mathematics', internal_marks: 0, exam_score: 0 },
  { subject_name: 'Physics', internal_marks: 0, exam_score: 0 },
  { subject_name: 'Chemistry', internal_marks: 0, exam_score: 0 },
  { subject_name: 'Biology', internal_marks: 0, exam_score: 0 },
];

export default function DataEntryModal({ onClose, onSubmit, loading, initialSubjects }) {
  const [semester, setSemester] = useState('Mid-Term 1');
  const [studyHours, setStudyHours] = useState(4.0);
  const [attendance, setAttendance] = useState(90);
  const [taskCompletion, setTaskCompletion] = useState(85);
  
  // If user has previous subjects, use them, otherwise use defaults
  const [subjects, setSubjects] = useState(
    initialSubjects && initialSubjects.length > 0 
      ? initialSubjects.map(s => ({ subject_name: s.subject_name, internal_marks: s.internal_marks, exam_score: s.exam_score }))
      : DEFAULT_SUBJECTS
  );

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = Number(value);
    setSubjects(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      semester,
      attendance_pct: attendance,
      daily_study_hours: studyHours,
      task_completion_rate: taskCompletion,
      subjects
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-fade-in">
        <button className="close-btn material-symbols-outlined" onClick={onClose}>close</button>
        <h2 className="t-h2 text-primary" style={{ marginBottom: '1.5rem' }}>Log Progress</h2>
        
        <form onSubmit={handleSubmit} className="data-entry-form">
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Record Name (e.g. Month 1)</label>
              <input type="text" className="input-field" value={semester} onChange={e => setSemester(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Daily Study Hours</label>
              <input type="number" step="0.5" className="input-field" value={studyHours} onChange={e => setStudyHours(e.target.value)} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Attendance (%)</label>
              <input type="number" min="0" max="100" className="input-field" value={attendance} onChange={e => setAttendance(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Task Completion (%)</label>
              <input type="number" min="0" max="100" className="input-field" value={taskCompletion} onChange={e => setTaskCompletion(e.target.value)} required />
            </div>
          </div>

          <h3 className="t-h3" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Subject Marks</h3>
          <p className="t-small text-muted" style={{ marginBottom: '1rem' }}>Enter scores out of 100.</p>
          
          <div className="subjects-grid">
            {subjects.map((subj, idx) => (
              <div key={idx} className="subject-entry">
                <label className="input-label text-secondary">{subj.subject_name}</label>
                <div className="subject-inputs">
                  <input 
                    type="number" 
                    placeholder="Internal" 
                    className="input-field" 
                    value={subj.internal_marks} 
                    onChange={e => handleSubjectChange(idx, 'internal_marks', e.target.value)}
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Exam" 
                    className="input-field" 
                    value={subj.exam_score} 
                    onChange={e => handleSubjectChange(idx, 'exam_score', e.target.value)}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading} style={{ marginTop: '2rem' }}>
            {loading ? <span className="task-spinner" /> : 'Calculate Prediction'}
          </button>
        </form>
      </div>
    </div>
  );
}
