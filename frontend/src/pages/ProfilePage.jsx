/**
 * ProfilePage — Social profile with badge collection and routine tracker.
 * Passes showToast for cheer feedback.
 */
import SocialProfile from '../components/SocialProfile/SocialProfile';
import Leaderboard from '../components/SocialProfile/Leaderboard';
import RoutineTracker from '../components/Gamification/RoutineTracker';
import { useStudent } from '../context/StudentContext';
import { studentProfile, badges, routineTasks } from '../data/mockData';
import './ProfilePage.css';

export default function ProfilePage({ showToast }) {
  const { student, studentId, updatePoints } = useStudent();
  const displayStudent = student || studentProfile;

  const handleTaskComplete = (taskId, pointsEarned, badgeUnlocked) => {
    updatePoints(pointsEarned);
    showToast?.(`+${pointsEarned} points earned!`, 'points');
    if (badgeUnlocked) {
      setTimeout(() => showToast?.(`🏆 Badge unlocked: ${badgeUnlocked}!`, 'badge'), 1500);
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
        <div style={{ marginTop: '2rem' }}>
          <Leaderboard />
        </div>
      </div>
      <aside className="profile-sidebar">
        <RoutineTracker
          tasks={routineTasks}
          totalPoints={displayStudent.total_points ?? displayStudent.totalPoints ?? 0}
          studentId={studentId}
          onTaskComplete={handleTaskComplete}
        />
      </aside>
    </div>
  );
}
