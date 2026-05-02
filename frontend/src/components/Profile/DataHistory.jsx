import { useState, useEffect } from 'react';
import api from '../../api/client';
import DataEntryModal from '../Dashboard/DataEntryModal';

export default function DataHistory({ studentId, showToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getAcademicRecords(studentId);
      setRecords(data.reverse()); // Show newest first
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchRecords();
    }
  }, [studentId]);

  const handleEditSubmit = async (data) => {
    try {
      await api.updateAcademicRecord(studentId, editingRecord.id, data);
      showToast?.('Record updated successfully. ML prediction recalculated.', 'success');
      setEditingRecord(null);
      fetchRecords();
    } catch (err) {
      showToast?.(err.message || 'Failed to update record', 'error');
    }
  };

  if (loading) {
    return <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'center' }}><span className="task-spinner" /></div>;
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h3 className="t-h3 text-primary" style={{ marginBottom: '1rem' }}>Data History</h3>
      <p className="t-muted" style={{ marginBottom: '1.5rem' }}>View or modify your past Weekly Reports to refine the ML model's accuracy.</p>
      
      {records.length === 0 ? (
        <p className="t-muted font-italic">No data logged yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map(record => (
            <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h4 className="t-h4" style={{ marginBottom: '0.25rem' }}>{record.semester}</h4>
                <p className="t-small text-muted">
                  Recorded: {new Date(record.recorded_at).toLocaleDateString()} | 
                  Overall: {record.overall_grade} | 
                  Predicted: <span className="text-secondary">{record.predicted_grade}</span>
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => setEditingRecord(record)}>
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {editingRecord && (
        <DataEntryModal 
          onClose={() => setEditingRecord(null)}
          onSubmit={handleEditSubmit}
          loading={false}
          initialSubjects={editingRecord.subject_scores.map(s => ({
            name: s.subject_name,
            internal_marks: s.internal_marks,
            exam_score: s.exam_score
          }))}
          // Note: In a full app, we would also pre-fill the DataEntryModal state with the editingRecord's attendance, study hours, etc.
          // For simplicity, we just pass initialSubjects.
        />
      )}
    </div>
  );
}
