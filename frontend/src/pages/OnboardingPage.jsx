import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './OnboardingPage.css';

export default function OnboardingPage({ onComplete, showToast }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form State
  const [level, setLevel] = useState(1);
  const [dailyStudyHours, setDailyStudyHours] = useState(2.0);
  const [sleepHours, setSleepHours] = useState(8.0);
  const [parentsIncome, setParentsIncome] = useState('middle');
  const [parentsEducation, setParentsEducation] = useState('high_school');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateOnboarding(user.id, {
        level: Number(level),
        daily_study_hours: parseFloat(dailyStudyHours),
        sleep_hours: parseFloat(sleepHours),
        parents_income_bracket: parentsIncome,
        parents_education: parentsEducation
      });
      showToast('Onboarding complete!', 'success');
      onComplete(); // Move to dashboard
    } catch (err) {
      showToast(err.message || 'Failed to save details', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page animate-fade-in">
      <div className="glass-card onboarding-card">
        <div className="onboarding-header">
          <h2 className="t-h2">Welcome to ScholarFlow!</h2>
          <p className="t-muted">Tell us a bit about yourself so we can personalize your ML predictions.</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="input-group">
            <label className="input-label">Current Academic Level (Grade/Year)</label>
            <input 
              type="number" 
              min="1" 
              max="12" 
              className="input-field" 
              value={level} 
              onChange={e => setLevel(e.target.value)} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Daily Study Hours</label>
              <input 
                type="number" 
                step="0.5" 
                min="0" 
                max="24" 
                className="input-field" 
                value={dailyStudyHours} 
                onChange={e => setDailyStudyHours(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Average Sleep (Hours)</label>
              <input 
                type="number" 
                step="0.5" 
                min="0" 
                max="24" 
                className="input-field" 
                value={sleepHours} 
                onChange={e => setSleepHours(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Parents Education Level</label>
            <select 
              className="input-field" 
              value={parentsEducation} 
              onChange={e => setParentsEducation(e.target.value)}
              style={{ height: 'auto', padding: '0.75rem' }}
            >
              <option value="none">None</option>
              <option value="primary">Primary School</option>
              <option value="high_school">High School</option>
              <option value="higher">Higher Education (College/University)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary onboarding-submit" disabled={loading}>
            {loading ? <span className="task-spinner" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
