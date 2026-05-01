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
import {
  trajectoryData as mockTrajectory,
  predictionResult as mockPrediction,
  subjects as mockSubjects,
  insights, routineTasks,
  studentProfile,
} from '../data/mockData';
import './DashboardPage.css';

export default function DashboardPage({ showToast }) {
  const { student, prediction, runPrediction, updatePoints, studentId } = useStudent();

  const [trajectoryData, setTrajectoryData] = useState(mockTrajectory);
  const [predictionResult, setPredictionResult] = useState(mockPrediction);
  const [subjects, setSubjects] = useState(mockSubjects);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);

  const displayStudent = student || studentProfile;

  /**
   * Called when a subject score changes in SubjectCards.
   * Rebuilds the feature set and calls the ML prediction API.
   */
  const handleScoreChange = useCallback(async (subjectId, field, value) => {
    // Update local subject state
    const updatedSubjects = subjects.map(s =>
      s.id === subjectId ? { ...s, [field]: Number(value) } : s
    );
    setSubjects(updatedSubjects);

    // Build prediction features from current subject averages
    const avgScore = updatedSubjects.reduce((sum, s) => sum + (s.score || 0), 0) / updatedSubjects.length;

    const features = {
      internal_marks: avgScore,
      exam_scores: avgScore,
      attendance_pct: 88,
      daily_study_hours: 4.5,
      task_completion_rate: 85,
      sleep_hours: 7.5,
      physical_activity_level: 'moderate',
      health_conditions: '',
      routine_adherence_pct: 80,
      parents_income_bracket: 'medium',
      parents_education: 'Graduate',
      has_internet_access: true,
      current_mood: 'motivated',
      energy_level: 7,
    };

    setIsLoadingPrediction(true);
    try {
      const result = await api.predictPerformance(features);
      setPredictionResult({
        predictedGrade: result.predicted_grade,
        confidence: result.confidence,
        riskLevel: result.risk_level,
        actionItems: result.action_items,
      });
      setTrajectoryData(result.trajectory_data);
      showToast?.(`ML Prediction updated: ${result.predicted_grade}`, 'success');
    } catch (err) {
      console.error('Prediction failed, using cached result:', err);
    } finally {
      setIsLoadingPrediction(false);
    }
  }, [subjects, showToast]);

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

  const average = Math.round(
    trajectoryData.reduce((s, d) => s + (d.score || 0), 0) / trajectoryData.length
  );

  return (
    <div className="dashboard-page">
      {/* Row 1: Performance Graph + Insights */}
      <section className="dash-row dash-hero">
        <div className="dash-main">
          <PerformanceGraph
            data={trajectoryData}
            average={average}
            predictedGrade={predictionResult.predictedGrade || predictionResult.predicted_grade}
            confidence={predictionResult.confidence}
            loading={isLoadingPrediction}
          />
        </div>
        <aside className="dash-sidebar">
          <InsightCards insights={insights} />
        </aside>
      </section>

      {/* Row 2: Subject Tracker */}
      <section className="dash-row">
        <SubjectCards subjects={subjects} onScoreChange={handleScoreChange} />
      </section>

      {/* Row 3: Action Plan + Routine Tracker */}
      <section className="dash-row dash-split">
        <div className="dash-main">
          <ActionPlan
            items={predictionResult.actionItems || predictionResult.action_items || []}
            predictedGrade={predictionResult.predictedGrade || predictionResult.predicted_grade}
          />
        </div>
        <aside className="dash-sidebar">
          <RoutineTracker
            tasks={routineTasks}
            totalPoints={displayStudent.total_points ?? displayStudent.totalPoints ?? 0}
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
            {displayStudent.current_streak ?? displayStudent.currentStreak ?? 0}
          </p>
          <p className="t-small text-muted" style={{ fontStyle: 'italic' }}>Days of consistent 80%+ scores</p>
        </div>
        <div className="bento-card bento-rank">
          <p className="t-eyebrow text-muted">Current Level</p>
          <p className="t-stat text-secondary" style={{ marginTop: '0.25rem' }}>
            Lv.{displayStudent.level ?? 1}
          </p>
          <p className="t-small text-muted" style={{ fontStyle: 'italic' }}>Knowledge Seeker tier</p>
        </div>
        <div className="bento-card bento-points">
          <p className="t-eyebrow text-muted">Total Points</p>
          <p className="t-stat text-primary" style={{ marginTop: '0.25rem' }}>
            {(displayStudent.total_points ?? displayStudent.totalPoints ?? 0).toLocaleString()}
          </p>
          <p className="t-small text-muted" style={{ fontStyle: 'italic' }}>Top 5% of all students</p>
        </div>
      </section>
    </div>
  );
}
