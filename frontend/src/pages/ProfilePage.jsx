/**
 * ProfilePage — Social profile with badge collection and routine tracker.
 * Passes showToast for cheer feedback.
 */
import SubjectManager from '../components/Profile/SubjectManager';
import DataHistory from '../components/Profile/DataHistory';
import SocialProfile from '../components/SocialProfile/SocialProfile';
import Leaderboard from '../components/SocialProfile/Leaderboard';
import RoutineTracker from '../components/Gamification/RoutineTracker';
import { useStudent } from '../context/StudentContext';
import { studentProfile, badges } from '../data/mockData';
import { useState, useEffect } from 'react';
import './ProfilePage.css';

export default function ProfilePage({ showToast }) {
  const { student, studentId, routines, updatePoints, fetchStudent } = useStudent();
  const displayStudent = student || studentProfile;
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(localStorage.getItem('notificationSound') !== 'false');
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('notificationSound', newState.toString());
    showToast?.(`Notification sound ${newState ? 'enabled' : 'disabled'}`, 'success');
  };



  const handleTaskComplete = (taskId, pointsEarned, badgeUnlocked) => {
    updatePoints(pointsEarned);
    showToast?.(`+${pointsEarned} points earned!`, 'points');
    if (badgeUnlocked) {
      setTimeout(() => showToast?.(`🏆 Badge unlocked: ${badgeUnlocked}!`, 'badge'), 1500);
    }
  };

  const handleSubjectsUpdated = () => {
    if (studentId) {
      fetchStudent(studentId);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-main">
        <SocialProfile
          student={displayStudent}
          badges={badges}
          cheerCount={42}
          showToast={showToast}
        />
        
        <SubjectManager 
          subjects={displayStudent.active_subjects || []} 
          studentId={studentId} 
          onSubjectsUpdated={handleSubjectsUpdated}
          showToast={showToast}
        />

        <DataHistory 
          studentId={studentId} 
          showToast={showToast} 
        />

        <div style={{ marginTop: '2rem' }}>
          <Leaderboard />
        </div>
      </div>
      <aside className="profile-sidebar">
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 className="t-h3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined">settings</span>
            Preferences
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500 }}>Notification Sound</p>
              <p className="t-small text-muted" style={{ margin: 0 }}>Play a sound when a task is due</p>
            </div>
            <button 
              className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'}`}
              onClick={toggleSound}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <span className="material-symbols-outlined">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
              {soundEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <RoutineTracker
          tasks={routines}
          totalPoints={displayStudent.total_points ?? displayStudent.totalPoints ?? 0}
          studentId={studentId}
          onTaskComplete={handleTaskComplete}
        />
      </aside>
    </div>
  );
}
