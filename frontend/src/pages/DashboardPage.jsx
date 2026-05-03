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
import RoutineManagement from '../components/Dashboard/RoutineManagement';
import { notificationService } from '../services/notificationService';
import {
  insights,
} from '../data/mockData';
import './DashboardPage.css';

/**
 * Generate personalized routine tasks based on the student's active subjects.
 * If the student has no subjects, returns a minimal wellness-only checklist.
 */
function buildRoutineTasks(activeSubjects = []) {
  const baseTasks = [
    { id: 'w-1', title: 'Morning meditation (10 min)', category: 'wellness', icon: 'self_improvement', points: 15, timeSlot: '06:00', completed: false },
  ];

  // Generate one study task per subject the student chose during onboarding
  const subjectTasks = activeSubjects.map((subj, idx) => ({
    id: `s-${subj.id || idx}`,
    title: `${subj.name} revision`,
    category: 'study',
    icon: 'menu_book',
    points: 25,
    timeSlot: `${String(7 + idx).padStart(2, '0')}:00`,
    completed: false,
  }));

  const endTasks = [
    { id: 'w-2', title: '30 min exercise', category: 'wellness', icon: 'fitness_center', points: 20, timeSlot: `${String(7 + subjectTasks.length).padStart(2, '0')}:00`, completed: false },
    { id: 'p-1', title: 'Evening journaling', category: 'personal', icon: 'edit_note', points: 10, timeSlot: '21:00', completed: false },
    { id: 'w-3', title: 'Sleep by 11 PM', category: 'wellness', icon: 'bedtime', points: 15, timeSlot: '23:00', completed: false },
  ];

  return [...baseTasks, ...subjectTasks, ...endTasks];
}

export default function DashboardPage({ showToast }) {
  const { student, updatePoints, studentId } = useStudent();

  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [predictionResult, setPredictionResult] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMgmtOpen, setIsMgmtOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState(null);

  const displayStudent = student || {};

  const fetchRoutine = useCallback(async () => {
    if (!studentId) return;
    try {
      const routines = await api.getGamificationRoutines(studentId);
      if (routines.length > 0) {
        setActiveRoutine(routines[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch routines:', err);
    }
  }, [studentId]);

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
      fetchRoutine();
    }
  }, [studentId, fetchAcademicData, fetchRoutine]);

  // Notification Check Interval
  useEffect(() => {
    if (activeRoutine?.tasks) {
      // Request permission once
      notificationService.requestPermission();

      const interval = setInterval(() => {
        notificationService.checkAndNotify(activeRoutine.tasks, (msg) => showToast?.(msg, 'info'));
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [activeRoutine, showToast]);

  const handleSaveRoutine = async (tasks) => {
    setIsSubmitting(true);
    try {
      const routineData = {
        name: "My Daily Routine",
        description: "Customized by user",
        tasks: tasks.map(t => ({
          title: t.title,
          category: t.category,
          time_slot: t.time_slot,
          points_value: t.points_value || 20,
        }))
      };

      if (activeRoutine) {
        await api.updateGamificationRoutine(studentId, activeRoutine.id, routineData);
      } else {
        await api.createGamificationRoutine(studentId, routineData);
      }
      
      showToast?.('Routine updated successfully!', 'success');
      setIsMgmtOpen(false);
      await fetchRoutine();
    } catch (err) {
      showToast?.('Failed to save routine', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsMgmtOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>settings_suggest</span>
            Setup Routine
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>add_chart</span>
            Weekly Report
          </button>
        </div>
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
        <SubjectCards 
          subjects={subjects.length > 0 ? subjects : (displayStudent.active_subjects || []).map(s => ({
            id: s.id,
            subject_name: s.name,
            internal_marks: 0,
            exam_score: 0,
            max_marks: 100,
            percentage: 0,
            status: 'new',
            color_accent: 'primary',
            icon_name: 'menu_book',
          }))}
        />
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
            tasks={activeRoutine?.tasks || []}
            totalPoints={displayStudent.total_points ?? 0}
            studentId={studentId}
            onTaskComplete={handleTaskComplete}
          />
        </aside>
      </section>

      {/* Row 4: Academic Progress Analysis */}
      <section className="dash-row">
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="t-h3">Academic Progress Analysis</h3>
            <span className="badge badge-tertiary">Live Insights</span>
          </div>
          
          <div className="academic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {(subjects.length > 0 ? subjects : (displayStudent.active_subjects || [])).map((s, i) => (
              <div key={i} className="progress-stat-card" style={{ background: 'var(--surface-mid)', padding: '1.25rem', borderRadius: '16px' }}>
                <p className="t-body" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{s.subject_name || s.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, height: '8px', background: 'var(--surface-low)', borderRadius: '4px' }}>
                    <div style={{ width: `${s.percentage || 0}%`, height: '100%', background: 'var(--secondary)', borderRadius: '4px' }} />
                  </div>
                  <span className="font-headline" style={{ fontSize: '1.25rem' }}>{s.percentage || 0}%</span>
                </div>
                <p className="t-small text-muted" style={{ marginTop: '0.5rem' }}>
                  {s.percentage > 80 ? '🔥 Performing exceptionally well' : s.percentage > 60 ? '📈 Steady progress' : '⚠️ Needs more focus'}
                </p>
              </div>
            ))}
          </div>
        </div>
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
      {isMgmtOpen && (
        <RoutineManagement
          currentTasks={activeRoutine?.tasks || []}
          onSave={handleSaveRoutine}
          onCancel={() => setIsMgmtOpen(false)}
          loading={isSubmitting}
        />
      )}
    </div>
  );
}
