/**
 * API Client — Centralized fetch wrapper for all backend calls.
 * Handles base URL, JSON serialization, auth headers, and error handling.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
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
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API] ${options.method || 'GET'} ${endpoint}:`, error.message);
      throw error;
    }
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
