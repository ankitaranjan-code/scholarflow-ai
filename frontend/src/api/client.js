/**
 * API Client — Centralized fetch wrapper for all backend calls.
 * Handles base URL, JSON serialization, auth headers, and error handling.
 * 
 * Features:
 *  • Automatic retry with exponential backoff for cold-start resilience
 *  • 90-second timeout to survive Render free-tier cold starts
 *  • Server warm-up ping on first load
 *  • Observable server status for UI feedback
 */

// Use environment variable, with a smart fallback to production Render URL if not on localhost
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // If we are in production (on Vercel) but VITE_API_URL is missing, use the known Render URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://scholarflow-ai.onrender.com/api';
  }
  
  return 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

// ── Server Status (observable by UI components) ──
let _serverStatus = 'unknown'; // 'unknown' | 'waking' | 'online' | 'offline'
const _statusListeners = new Set();

function setServerStatus(status) {
  if (_serverStatus === status) return;
  _serverStatus = status;
  _statusListeners.forEach(fn => fn(status));
}

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this._warmUpPromise = null;
  }

  /**
   * Subscribe to server status changes.
   * Returns an unsubscribe function.
   */
  onStatusChange(listener) {
    _statusListeners.add(listener);
    // Immediately notify with current status
    listener(_serverStatus);
    return () => _statusListeners.delete(listener);
  }

  /** Get the current server status. */
  get serverStatus() {
    return _serverStatus;
  }

  /**
   * Get the auth token from localStorage (will be used after Phase 2).
   */
  getAuthHeaders() {
    const token = localStorage.getItem('sf_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Core request method — all API calls go through here.
   * Includes retry logic for resilience against Render cold starts.
   */
  async request(endpoint, options = {}) {
    // Strip trailing slashes from baseUrl to prevent double-slash errors (e.g. /api//auth/login)
    const safeBaseUrl = this.baseUrl.replace(/\/+$/, '');
    const url = `${safeBaseUrl}${endpoint}`;

    // Build headers properly — merge default, auth, and custom headers without overwrite
    const mergedHeaders = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    // Build config WITHOUT spreading options.headers again
    const { headers: _discardedHeaders, ...restOptions } = options;
    const config = {
      ...restOptions,
      headers: mergedHeaders,
    };

    // Use a generous 90-second timeout so the spinner never hangs forever,
    // but still survives Render free-tier cold starts (which can take 30-60s)
    const TIMEOUT_MS = 90_000;
    const MAX_RETRIES = 2;

    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        if (attempt > 0) {
          console.log(`[API] Retry #${attempt} for ${endpoint}...`);
          // Exponential backoff: 2s, 4s
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }

        const response = await fetch(url, { ...config, signal: controller.signal });
        clearTimeout(timeoutId);

        // Server responded — it's online
        setServerStatus('online');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `API Error: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;

        if (error.name === 'AbortError') {
          console.error(`[API] Timeout connecting to backend (attempt ${attempt + 1})`);
          setServerStatus('offline');
          lastError = new Error(
            'Server is taking too long to respond. It may be starting up — please try again in a moment.'
          );
          // Don't retry on full timeout — it won't help
          break;
        }

        // Network errors (DNS, refused, etc.) — retry if possible
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setServerStatus('waking');
          console.warn(`[API] Network error on attempt ${attempt + 1}: ${error.message}`);
          continue; // Will retry
        }

        // Application-level errors (4xx, 5xx) — don't retry
        console.error(`[API] ${restOptions.method || 'GET'} ${endpoint}:`, error.message);
        break;
      }
    }

    throw lastError;
  }

  /**
   * Wake up the backend server by pinging the health endpoint.
   * Called once when the app loads so the server is ready by the time the user logs in.
   * Returns a promise that resolves when the server responds (or after max attempts).
   */
  warmUp() {
    if (this._warmUpPromise) return this._warmUpPromise;

    this._warmUpPromise = (async () => {
      // Don't warm up localhost
      if (this.baseUrl.includes('localhost')) {
        setServerStatus('online');
        return;
      }

      setServerStatus('waking');
      console.log('[API] Sending warm-up ping to backend...');

      // Ping the root health endpoint (not /api, just the root)
      const healthUrl = this.baseUrl.replace(/\/api\/?$/, '');

      for (let i = 0; i < 3; i++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30_000);

          const resp = await fetch(healthUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (resp.ok) {
            setServerStatus('online');
            console.log('[API] Backend is awake and ready.');
            return;
          }
        } catch (err) {
          console.warn(`[API] Warm-up ping attempt ${i + 1} failed:`, err.message);
          if (i < 2) await new Promise(r => setTimeout(r, 5000));
        }
      }

      // After 3 failed attempts, set offline but don't block the app
      setServerStatus('offline');
      console.warn('[API] Backend did not respond to warm-up pings.');
    })();

    return this._warmUpPromise;
  }

  // ── Auth Endpoints ──
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return this.request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  }

  async register(data) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // ── Student & ML Endpoints ──
  async getStudent(studentId) {
    return this.request(`/students/${studentId}`);
  }

  async createStudent(data) {
    return this.request('/students/', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateOnboarding(studentId, data) {
    return this.request(`/students/${studentId}/onboarding`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAcademicRecords(studentId) {
    return this.request(`/students/${studentId}/academic-records`);
  }

  async submitAcademicRecord(studentId, data) {
    return this.request(`/students/${studentId}/academic-records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAcademicRecord(studentId, recordId, data) {
    return this.request(`/students/${studentId}/academic-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addActiveSubject(studentId, name) {
    return this.request(`/students/${studentId}/subjects`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteActiveSubject(studentId, subjectId) {
    return this.request(`/students/${studentId}/subjects/${subjectId}`, {
      method: 'DELETE',
    });
  }

  async predictPerformance(features) {
    return this.request('/students/predict', { method: 'POST', body: JSON.stringify(features) });
  }

  async logMood(studentId, data) {
    return this.request(`/students/${studentId}/mood`, { method: 'POST', body: JSON.stringify(data) });
  }

  async getMoodLogs(studentId, limit = 7) {
    return this.request(`/students/${studentId}/mood?limit=${limit}`);
  }

  // ── Gamification Endpoints ──
  async getLeaderboard() {
    return this.request('/gamification/leaderboard');
  }

  async getRoutines(studentId) {
    return this.request(`/gamification/${studentId}/routines`);
  }

  async createRoutine(studentId, data) {
    return this.request(`/gamification/${studentId}/routines`, { method: 'POST', body: JSON.stringify(data) });
  }

  async completeTask(studentId, taskId) {
    return this.request(`/gamification/${studentId}/complete-task`, {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId }),
    });
  }

  async deleteRoutine(studentId, routineId) {
    return this.request(`/gamification/${studentId}/routines/${routineId}`, {
      method: 'DELETE',
    });
  }

  async deleteTask(studentId, routineId, taskId) {
    return this.request(`/gamification/${studentId}/routines/${routineId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async getPublicProfile(studentId) {
    return this.request(`/gamification/profile/${studentId}`);
  }

  async sendCheer(studentId, message = '🎉 Keep it up!') {
    return this.request(`/gamification/profile/${studentId}/cheer`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // ── Chat Endpoints ──
  async getChatSessions(studentId) {
    return this.request(`/chat/${studentId}/sessions`);
  }

  async createChatSession(studentId) {
    return this.request(`/chat/${studentId}/sessions`, { method: 'POST' });
  }

  async sendChatMessage(studentId, sessionId, content, mode = 'casual') {
    return this.request(`/chat/${studentId}/sessions/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, mode }),
    });
  }

  async generateRoutine(description) {
    return this.request('/chat/generate-routine', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  // ── Admin Endpoints ──
  async getAllUsers() {
    return this.request('/admin/users');
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  async updateUserRole(userId, isAdmin) {
    return this.request(`/admin/users/${userId}/role?is_admin=${isAdmin}`, { method: 'PUT' });
  }

  async uploadMLData(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/admin/ml/upload-data', {
      method: 'POST',
      body: formData,
    });
  }

  async getApiKey() {
    return this.request('/admin/settings/api-key');
  }

  async updateApiKey(apiKey) {
    return this.request('/admin/settings/api-key', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    });
  }
}

// Export a singleton instance
const api = new ApiClient();
export default api;
