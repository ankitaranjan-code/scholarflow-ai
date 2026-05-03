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
  const { student, studentId, updatePoints, fetchStudent } = useStudent();
  const displayStudent = student || studentProfile;

  // Build routine tasks dynamically from student's active subjects
  const buildRoutineTasks = (activeSubjects = []) => {
    const baseTasks = [
      { id: 'w-1', title: 'Morning meditation (10 min)', category: 'wellness', icon: 'self_improvement', points: 15, timeSlot: '06:00', completed: false },
    ];
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
  };

  const dynamicRoutineTasks = buildRoutineTasks(displayStudent.active_subjects);

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
          tasks={dynamicRoutineTasks}
          totalPoints={displayStudent.total_points ?? displayStudent.totalPoints ?? 0}
          studentId={studentId}
          onTaskComplete={handleTaskComplete}
        />
      </aside>
    </div>
  );
}
