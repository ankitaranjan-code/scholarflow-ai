import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './AuthPage.css';

export default function AuthPage({ showToast, onRegisterSuccess }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Subscribe to server status so we can show warm-up feedback
  useEffect(() => {
    const unsub = api.onStatusChange((status) => {
      setServerStatus(status);
    });
    // Trigger warm-up when the auth page mounts
    api.warmUp();
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      showToast?.('Passwords do not match', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
        showToast?.('Successfully logged in!', 'success');
      } else {
        await register({ username, password, email, display_name: displayName });
        showToast?.('Account created successfully!', 'success');
        if (onRegisterSuccess) onRegisterSuccess();
      }
    } catch (err) {
      const message = err.message || 'Authentication failed';
      showToast?.(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Status banner content
  const getStatusBanner = () => {
    if (serverStatus === 'waking') {
      return (
        <div className="server-status-banner waking">
          <span className="task-spinner" style={{ width: '1rem', height: '1rem' }} />
          <span>Server is waking up… this may take up to a minute</span>
        </div>
      );
    }
    if (serverStatus === 'offline') {
      return (
        <div className="server-status-banner offline">
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cloud_off</span>
          <span>Server is starting up. Sign-in may be slow on first attempt.</span>
        </div>
      );
    }
    if (serverStatus === 'online') {
      return (
        <div className="server-status-banner online">
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
          <span>Server is ready</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined font-headline" style={{ color: 'var(--primary)', fontSize: '2rem' }}>
              school
            </span>
          </div>
          <h2 className="t-h2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="t-muted">
            {isLogin ? 'Sign in to access your dashboard' : 'Join ScholarFlow AI today'}
          </p>
        </div>

        {/* Server status banner */}
        {getStatusBanner()}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Jane Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Rewrite password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-loading-content">
                <span className="task-spinner" />
                <span>{serverStatus === 'waking' ? 'Connecting...' : 'Signing in...'}</span>
              </span>
            ) : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="t-small text-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="btn-ghost auth-toggle-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
