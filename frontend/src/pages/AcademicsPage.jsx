import { useState, useEffect, useCallback } from 'react';
import { useStudent } from '../context/StudentContext';
import api from '../api/client';
import SubjectCards from '../components/Dashboard/SubjectCards';
import DataHistory from '../components/Profile/DataHistory';
import PerformanceGraph from '../components/Dashboard/PerformanceGraph';
import './AcademicsPage.css';

export default function AcademicsPage({ showToast }) {
  const { student, studentId } = useStudent();
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const displayStudent = student || {};

  const fetchAcademicData = useCallback(async () => {
    setIsLoading(true);
    try {
      const academicRecords = await api.getAcademicRecords(studentId);
      setRecords(academicRecords);

      if (academicRecords.length > 0) {
        const latestRecord = academicRecords[academicRecords.length - 1];
        setSubjects(latestRecord.subject_scores);
      } else {
        if (displayStudent.active_subjects) {
          const defaultSubjects = displayStudent.active_subjects.map(subj => ({
            id: subj.id,
            subject_name: subj.name,
            internal_marks: 0,
            exam_score: 0,
            max_marks: 100,
            percentage: 0,
            status: 'new',
            color_accent: 'primary',
            icon_name: 'menu_book',
          }));
          setSubjects(defaultSubjects);
        } else {
          setSubjects([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch academic records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, displayStudent.active_subjects]);

  useEffect(() => {
    if (studentId) {
      fetchAcademicData();
    }
  }, [studentId, fetchAcademicData]);

  const trajectoryData = records.map(r => ({
    month: r.semester,
    score: parseFloat(r.overall_grade.replace('%', '')) || 0
  }));

  const average = trajectoryData.length > 0 
    ? Math.round(trajectoryData.reduce((s, d) => s + (d.score || 0), 0) / trajectoryData.length)
    : 0;

  return (
    <div className="academics-page animate-fade-in">
      <div className="academics-header">
        <h2 className="t-h2 text-primary">Academic Progress</h2>
        <p className="t-muted">Track your mastery, completion rates, and subject performance in detail.</p>
      </div>

      <div className="academics-content">
        {/* Performance Trajectory */}
        <section className="academics-section">
          {records.length > 0 ? (
            <PerformanceGraph
              data={trajectoryData}
              average={average}
              predictedGrade={records[records.length - 1]?.predicted_grade || '?'}
              confidence={records[records.length - 1]?.confidence_score || 0}
              loading={isLoading}
            />
          ) : (
            <div className="glass-card empty-state">
              <span className="material-symbols-outlined text-muted" style={{ fontSize: '3rem' }}>school</span>
              <h3 className="t-h3 mt-2">No Academic Records Yet</h3>
              <p className="t-muted">Log your weekly report on the Growth tab to see your performance trajectory here.</p>
            </div>
          )}
        </section>

        {/* Detailed Subject Breakdown */}
        <section className="academics-section">
          <h3 className="t-h3 mb-2 text-secondary">Subject Mastery Breakdown</h3>
          <SubjectCards subjects={subjects} />
        </section>

        {/* Historical Logs */}
        <section className="academics-section mt-4">
          <h3 className="t-h3 mb-2">Historical Marks & Logs</h3>
          <DataHistory studentId={studentId} showToast={showToast} />
        </section>
      </div>
    </div>
  );
}
