/**
 * App.jsx — Root component with tab-based navigation.
 * Wrapped with StudentProvider for global state management.
 */
import { useState, useEffect } from 'react';
import './App.css';
import { StudentProvider } from './context/StudentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import TopBar from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
import Toast from './components/Layout/Toast';
import DashboardPage from './pages/DashboardPage';
import AcademicsPage from './pages/AcademicsPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';

import HomePage from './pages/HomePage';
import OnboardingPage from './pages/OnboardingPage';
import { useStudent } from './context/StudentContext';
import { useTaskNotifier } from './hooks/useTaskNotifier';
import api from './api/client';

function InnerApp() {
  const { user, loading } = useAuth();
  const { routines, studentId, updatePoints } = useStudent();
  const [activeTab, setActiveTab] = useState(null);
  const [authMode, setAuthMode] = useState('home'); // 'home' or 'auth'
  const [toast, setToast] = useState(null);
  const [notificationPrompt, setNotificationPrompt] = useState(null);
  const [soundError, setSoundError] = useState(false);

  // Warm up the backend server on first load so it's ready by the time the user logs in
  useEffect(() => {
    api.warmUp();
  }, []);

  useTaskNotifier(routines, (task) => {
    // Check if we should notify
    setNotificationPrompt(task);
  }, () => {
    setSoundError(true);
  });

  const handleTaskComplete = async (task) => {
    try {
      const result = await api.completeTask(studentId, task.id);
      updatePoints(result.points_earned);
      showToast(`+${result.points_earned} points earned!`, 'success');
      if (result.badge_unlocked) {
        setTimeout(() => showToast(`🏆 Badge unlocked: ${result.badge_unlocked}!`, 'badge'), 1500);
      }
    } catch (e) {
      showToast('Failed to complete task', 'error');
    }
    setNotificationPrompt(null);
  };

  useEffect(() => {
    if (user && !activeTab) {
      setActiveTab(user.is_admin ? 'admin' : 'dashboard');
    }
  }, [user, activeTab]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <span className="task-spinner" style={{ width: '2rem', height: '2rem' }} />
        </div>
      );
    }

    if (!user) {
      if (authMode === 'home') {
        return <HomePage onGetStarted={() => setAuthMode('auth')} />;
      }
      return <AuthPage showToast={showToast} onRegisterSuccess={() => setActiveTab('onboarding')} />;
    }

    return (
      <>
        <TopBar />
        <main className="main-content">
          {(() => {
            switch (activeTab) {
              case 'onboarding': return <OnboardingPage showToast={showToast} onComplete={() => setActiveTab('dashboard')} />;
              case 'dashboard': return <DashboardPage showToast={showToast} />;
              case 'academics': return <AcademicsPage showToast={showToast} />;
              case 'chat': return <ChatPage />;
              case 'profile': return <ProfilePage showToast={showToast} />;
              case 'admin': return <AdminPage showToast={showToast} />;
              default: return <DashboardPage showToast={showToast} />;
            }
          })()}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        {notificationPrompt && (
          <div className="notification-prompt glass-card">
            <div className="notification-prompt-header">
              <div className="notification-prompt-icon">
                <span className="material-symbols-outlined">{notificationPrompt.icon || 'notifications_active'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <p className="t-eyebrow text-primary" style={{ margin: 0 }}>Task Reminder</p>
                <h4 className="t-h4" style={{ margin: 0 }}>{notificationPrompt.title}</h4>
              </div>
            </div>
            <p className="t-small text-muted">Hey! It's time for this task. Have you started or finished it yet?</p>
            <div className="notification-prompt-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setNotificationPrompt(null)}>Later</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleTaskComplete(notificationPrompt)}>Yes, Done!</button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="noise-overlay" />
      {renderContent()}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {soundError && (
        <div className="toast toast-warning" style={{ zIndex: 9999, position: 'fixed', top: '5rem', right: '1rem', padding: '1rem', background: '#ffeb3b', color: '#000', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined">volume_off</span>
          <span style={{ fontWeight: 500 }}>Enable Notification Sound?</span>
          <button 
            style={{ background: '#000', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => {
              const audio = new Audio('/notification.wav');
              audio.play().catch(() => {});
              setSoundError(false);
            }}
          >
            Enable
          </button>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <StudentProvider>
        <InnerApp />
      </StudentProvider>
    </AuthProvider>
  );
}

export default App;
