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
import './ProfilePage.css';

export default function ProfilePage({ showToast }) {
  const { student, studentId, routines, updatePoints, fetchStudent } = useStudent();
  const displayStudent = student || studentProfile;



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
