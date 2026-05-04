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
import RoutineSetupModal from '../components/Dashboard/RoutineSetupModal';

import './DashboardPage.css';
import mascotImg from '../assets/mascot.png';
import stickersImg from '../assets/stickers.png';


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
  const { student, updatePoints, studentId, setRoutines } = useStudent();

  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [predictionResult, setPredictionResult] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedRoutineTasks, setSavedRoutineTasks] = useState(null);

  const displayStudent = student || {};

  // Sync local routine tasks to global context so notifications work
  useEffect(() => {
    if (savedRoutineTasks) {
      setRoutines(savedRoutineTasks);
    } else {
      setRoutines([]);
    }
  }, [savedRoutineTasks, setRoutines]);


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

      // Fetch custom routines
      try {
        const routines = await api.getRoutines(studentId);
        if (routines && routines.length > 0) {
          const activeRoutine = routines[0];
          setSavedRoutineTasks(activeRoutine.tasks.map(t => ({
            id: t.id,
            routineId: activeRoutine.id,
            title: t.title,
            category: t.category,
            icon: t.icon_name,
            points: t.points_value,
            timeSlot: t.time_slot,
            completed: t.is_completed_today
          })));
        }
      } catch (e) {
        console.error('Failed to fetch routines', e);
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

  // Generate Dynamic Insights
  let dashboardInsights = [];
  if (records.length === 0) {
    dashboardInsights.push({
      type: "info",
      title: "Welcome to ScholarFlow",
      message: "Log your first weekly report to generate personalized AI insights about your performance.",
      icon: "insights"
    });
  } else {
    const latestRecord = records[records.length - 1];
    const criticalSubjects = latestRecord.subject_scores.filter(s => s.status === 'critical');
    const peakSubjects = latestRecord.subject_scores.filter(s => s.status === 'peak');

    if (criticalSubjects.length > 0) {
      dashboardInsights.push({
        type: "warning",
        title: "Needs Attention",
        message: `Your score in ${criticalSubjects.map(s => s.subject_name).join(', ')} needs attention.`,
        tip: `Focus on ${criticalSubjects[0].subject_name} this week.`,
        icon: "warning"
      });
    }
    if (peakSubjects.length > 0) {
      dashboardInsights.push({
        type: "success",
        title: "Mastery Reached",
        message: `You are performing excellently in ${peakSubjects.map(s => s.subject_name).join(', ')}. Keep it up!`,
        icon: "check_circle"
      });
    }
    if (dashboardInsights.length === 0) {
      dashboardInsights.push({
        type: "info",
        title: "Steady Progress",
        message: "You are maintaining a steady pace. Keep up the good work and stick to your routines!",
        icon: "trending_up"
      });
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem 0' }}>
        <div>
          <h2 className="t-h2 text-primary">Hello {displayStudent.username || 'Scholar'}!</h2>
          <p className="t-muted">Welcome back to your dashboard.</p>
        </div>
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
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <img src={mascotImg} alt="Scholar Mascot" className="sticker animate-float" style={{ width: '180px', marginBottom: '1.5rem' }} />
              <h3 className="t-h3" style={{ marginBottom: '0.5rem' }}>Your Journey Starts Here!</h3>
              <p className="t-muted">Click "Weekly Report" above to enter your current marks and let me analyze your growth trajectory!</p>
            </div>
          )}
        </div>
        <aside className="dash-sidebar">
          <InsightCards insights={dashboardInsights} />
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
            tasks={savedRoutineTasks}
            totalPoints={displayStudent.total_points ?? 0}
            studentId={studentId}
            onTaskComplete={handleTaskComplete}
            onSetupClick={() => setIsRoutineModalOpen(true)}
            onRoutineDeleted={() => {
              setSavedRoutineTasks(null);
              showToast?.('Routine deleted. Create a new one anytime!', 'success');
            }}
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

      {isRoutineModalOpen && (
        <RoutineSetupModal
          isOpen={isRoutineModalOpen}
          onClose={() => setIsRoutineModalOpen(false)}
          studentId={studentId}
          activeSubjects={displayStudent.active_subjects || []}
          onSave={(newRoutine) => {
            setSavedRoutineTasks(newRoutine.tasks.map(t => ({
              id: t.id,
              routineId: newRoutine.id,
              title: t.title,
              category: t.category,
              icon: t.icon_name,
              points: t.points_value,
              timeSlot: t.time_slot,
              completed: t.is_completed_today
            })));
            showToast?.('Routine saved successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}
