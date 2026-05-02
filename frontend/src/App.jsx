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
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';

import HomePage from './pages/HomePage';
import OnboardingPage from './pages/OnboardingPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [authMode, setAuthMode] = useState('home'); // 'home' or 'auth'
  const [toast, setToast] = useState(null);

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
              case 'chat': return <ChatPage />;
              case 'profile': return <ProfilePage showToast={showToast} />;
              case 'admin': return <AdminPage showToast={showToast} />;
              default: return <DashboardPage showToast={showToast} />;
            }
          })()}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  };

  return (
    <StudentProvider>
      <div className="noise-overlay" />
      {renderContent()}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </StudentProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
