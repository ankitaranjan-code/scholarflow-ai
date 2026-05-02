/**
 * DashboardPage — Integrates Performance Graph, AI Insights,
 * Subject Tracker, Action Plan, and Routine Tracker.
 * Now calls the real ML prediction API and gamification endpoints.
 */
import { useState, useEffect, useCallback } from 'react';
import { useStudent } from '../context/StudentContext';
import api from '../api/client';
import PerformanceGraph from '../components/Dashboard/PerformanceGraph';
import InsightCards from '../components/Dashboard/InsightCards';
import SubjectCards from '../components/Dashboard/SubjectCards';
import ActionPlan from '../components/Dashboard/ActionPlan';
import RoutineTracker from '../components/Gamification/RoutineTracker';
import DataEntryModal from '../components/Dashboard/DataEntryModal';
import {
  insights, routineTasks,
} from '../data/mockData';
import './DashboardPage.css';

export default function DashboardPage({ showToast }) {
  const { student, updatePoints, studentId } = useStudent();

  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [predictionResult, setPredictionResult] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayStudent = student || {};

  const fetchAcademicData = useCallback(async () => {
    setIsLoading(true);
    try {
      const academicRecords = await api.getAcademicRecords(studentId);
      setRecords(academicRecords);

      if (academicRecords.length > 0) {
        const latestRecord = academicRecords[academicRecords.length - 1];
        setSubjects(latestRecord.subject_scores);
        setPredictionResult({
          predictedGrade: latestRecord.predicted_grade,
          confidence: latestRecord.confidence_score,
          actionItems: [
            `Maintain your ${latestRecord.attendance_pct}% attendance.`,
            `Your average study time of ${latestRecord.daily_study_hours}h is perfect.`,
            `Focus on any subjects currently marked as CRITICAL.`
          ]
        });
      }
    } catch (err) {
      console.error('Failed to fetch academic records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchAcademicData();
    }
  }, [studentId, fetchAcademicData]);

  const handleLogProgress = async (data) => {
    setIsSubmitting(true);
    try {
      const newRecord = await api.submitAcademicRecord(studentId, data);
      showToast?.('Progress logged! ML Prediction updated.', 'success');
      setIsModalOpen(false);
      // Refresh data
      await fetchAcademicData();
    } catch (err) {
      showToast?.(err.message || 'Failed to log progress', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Called when a routine task is completed via the API.
   */
  const handleTaskComplete = useCallback(async (taskId, pointsEarned, badgeUnlocked) => {
    updatePoints(pointsEarned);
    showToast?.(`+${pointsEarned} points earned!`, 'points');
    if (badgeUnlocked) {
      setTimeout(() => showToast?.(`🏆 Badge unlocked: ${badgeUnlocked}!`, 'badge'), 1500);
    }
  }, [updatePoints, showToast]);

  const trajectoryData = records.map(r => ({
    month: r.semester,
    score: parseFloat(r.overall_grade.replace('%', '')) || 0
  }));

  const average = trajectoryData.length > 0 
    ? Math.round(trajectoryData.reduce((s, d) => s + (d.score || 0), 0) / trajectoryData.length)
    : 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem 0' }}>
        <h2 className="t-h2 text-primary">Your Dashboard</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>add_chart</span>
          Weekly Report
        </button>
      </div>

      {/* Row 1: Performance Graph + Insights */}
      <section className="dash-row dash-hero">
        <div className="dash-main">
          {records.length > 0 ? (
            <PerformanceGraph
              data={trajectoryData}
              average={average}
              predictedGrade={predictionResult.predictedGrade}
              confidence={predictionResult.confidence}
              loading={isLoading}
            />
          ) : (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="material-symbols-outlined text-muted" style={{ fontSize: '4rem', marginBottom: '1rem' }}>insights</span>
              <h3 className="t-h3" style={{ marginBottom: '0.5rem' }}>No Data Logged Yet</h3>
              <p className="t-muted">Click "Weekly Report" above to enter your current marks and generate your first AI prediction!</p>
            </div>
          )}
        </div>
        <aside className="dash-sidebar">
          <InsightCards insights={insights} />
        </aside>
      </section>

      {/* Row 2: Subject Tracker */}
      <section className="dash-row">
        <SubjectCards subjects={subjects} />
      </section>

      {/* Row 3: Action Plan + Routine Tracker */}
      <section className="dash-row dash-split">
        <div className="dash-main">
          <ActionPlan
            items={predictionResult.actionItems || ['Complete your daily routines to unlock your action plan.']}
            predictedGrade={predictionResult.predictedGrade || '?'}
          />
        </div>
        <aside className="dash-sidebar">
          <RoutineTracker
            tasks={routineTasks}
            totalPoints={displayStudent.total_points ?? 0}
            studentId={studentId}
            onTaskComplete={handleTaskComplete}
          />
        </aside>
      </section>

      {/* Bento Stats Row */}
      <section className="dash-row bento-row">
        <div className="bento-card bento-streak">
          <p className="t-eyebrow text-muted">Active Streak</p>
          <p className="t-stat text-tertiary" style={{ marginTop: '0.25rem' }}>
            {displayStudent.current_streak ?? 0}
          </p>
          <p className="t-small text-muted" style={{ fontStyle: 'italic' }}>Days of consistent logging</p>
        </div>
        <div className="bento-card bento-rank">
          <p className="t-eyebrow text-muted">Academic Stage</p>
          <p className="t-stat text-secondary" style={{ marginTop: '0.25rem', fontSize: '1.5rem' }}>
            {displayStudent.education_stage || 'Class'} {displayStudent.level ?? 1}
          </p>
          <p className="t-small text-muted" style={{ fontStyle: 'italic', textTransform: 'capitalize' }}>
            {displayStudent.institution_type ? `${displayStudent.institution_type} Student` : 'Institution Student'}
          </p>
        </div>
        <div className="bento-card bento-points">
          <p className="t-eyebrow text-muted">Total Points</p>
          <p className="t-stat text-primary" style={{ marginTop: '0.25rem' }}>
            {(displayStudent.total_points ?? 0).toLocaleString()}
          </p>
          <p className="t-small text-muted" style={{ fontStyle: 'italic' }}>Top 5% of all students</p>
        </div>
      </section>

      {isModalOpen && (
        <DataEntryModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleLogProgress}
          loading={isSubmitting}
          initialSubjects={displayStudent.active_subjects || []}
        />
      )}
    </div>
  );
}
