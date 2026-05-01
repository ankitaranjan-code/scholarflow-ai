import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './AdminPage.css';

export default function AdminPage({ showToast }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Settings State
  const [apiKeyInfo, setApiKeyInfo] = useState({ masked_key: '', is_configured: false });
  const [newApiKey, setNewApiKey] = useState('');
  
  // ML State
  const [file, setFile] = useState(null);
  const [retrainingLogs, setRetrainingLogs] = useState('');
  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    if (user?.is_admin) {
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'settings') fetchApiKey();
    }
  }, [activeTab, user]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchApiKey = async () => {
    try {
      const data = await api.getApiKey();
      setApiKeyInfo(data);
    } catch (err) {
      showToast('Failed to load API key info', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(userId);
      showToast('User deleted', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRoleChange = async (userId, isAdmin) => {
    try {
      await api.updateUserRole(userId, isAdmin);
      showToast('User role updated', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleApiKeyUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateApiKey(newApiKey);
      showToast('API Key updated successfully', 'success');
      setNewApiKey('');
      fetchApiKey();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMLUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsRetraining(true);
    setRetrainingLogs('');
    try {
      showToast('Uploading and retraining ML model...', 'success');
      const response = await api.uploadMLData(file);
      setRetrainingLogs(response.retrain_logs);
      showToast('ML Model updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      setRetrainingLogs(err.message);
    } finally {
      setIsRetraining(false);
      setFile(null);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="admin-page">
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 className="t-h2 text-danger">Access Denied</h2>
          <p>You do not have permission to view the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <h1 className="t-h1">Admin Control Center</h1>
        <div className="admin-tabs">
          <button className={`btn-ghost ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
          <button className={`btn-ghost ${activeTab === 'ml' ? 'active' : ''}`} onClick={() => setActiveTab('ml')}>ML Training</button>
          <button className={`btn-ghost ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
        </div>
      </div>

      <div className="admin-content">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="glass-card admin-card">
            <h3 className="t-h3">User Management</h3>
            {loadingUsers ? <p>Loading users...</p> : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Level</th>
                      <th>Points</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{u.level}</td>
                        <td>{u.total_points}</td>
                        <td>
                          <select 
                            value={u.is_admin ? "admin" : "user"} 
                            onChange={(e) => handleRoleChange(u.id, e.target.value === 'admin')}
                            disabled={u.id === user.id}
                            className="input-field"
                            style={{ padding: '0.25rem', height: 'auto' }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            title="Delete User"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ML TAB */}
        {activeTab === 'ml' && (
          <div className="glass-card admin-card">
            <h3 className="t-h3">Machine Learning Engine</h3>
            <p className="t-muted" style={{ marginBottom: '1.5rem' }}>
              Upload a new CSV dataset (student-mat format) to retrain the Random Forest model dynamically.
            </p>
            <form onSubmit={handleMLUpload} className="admin-form">
              <div className="input-group">
                <label className="input-label">Dataset (CSV)</label>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="input-field"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isRetraining || !file}>
                {isRetraining ? 'Retraining...' : 'Upload & Retrain'}
              </button>
            </form>

            {retrainingLogs && (
              <div className="admin-logs">
                <h4 className="t-h4" style={{ marginBottom: '0.5rem' }}>Retraining Output:</h4>
                <pre className="code-block">{retrainingLogs}</pre>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="glass-card admin-card">
            <h3 className="t-h3">Platform Settings</h3>
            
            <div className="settings-section">
              <h4 className="t-h4">Gemini API Configuration</h4>
              <p className="t-muted">
                Status: {apiKeyInfo.is_configured ? <span style={{ color: 'var(--success)' }}>Active ({apiKeyInfo.masked_key})</span> : <span style={{ color: 'var(--danger)' }}>Not Configured</span>}
              </p>
              
              <form onSubmit={handleApiKeyUpdate} className="admin-form" style={{ marginTop: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">New API Key</label>
                  <input 
                    type="password" 
                    placeholder="AIzaSy..." 
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Update Key</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
