/**
 * SubjectCards — Grid of subject score cards with progress bars.
 * Now fires onScoreChange callback to trigger ML prediction.
 */
import './SubjectCards.css';

const accentMap = {
  error: { fill: 'fill-error', badge: 'badge-error', label: 'Critical' },
  primary: { fill: 'fill-primary', badge: 'badge-primary', label: 'Steady' },
  secondary: { fill: 'fill-secondary', badge: 'badge-secondary', label: 'Good' },
  tertiary: { fill: 'fill-tertiary', badge: 'badge-tertiary', label: 'Peak' },
};

export default function SubjectCards({ subjects, onScoreChange }) {
  const handleInputChange = (subjectId, e) => {
    const value = e.target.value;
    if (value !== '' && onScoreChange) {
      onScoreChange(subjectId, 'score', value);
    }
  };

  return (
    <div className="subject-section animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <div className="subject-section-header">
        <div>
          <h3 className="t-h3">Subject-wise Tracker</h3>
          <p className="t-muted">Enter marks to trigger ML prediction in real-time</p>
        </div>
      </div>

      <div className="subjects-grid">
        {subjects.map((subj) => {
          const a = accentMap[subj.accent] || accentMap.primary;
          return (
            <div key={subj.id} className={`subject-card subject-border-${subj.accent}`}>
              <div className="subject-card-header">
                <div className={`subject-icon-wrap icon-${subj.accent}`}>
                  <span className="material-symbols-outlined">{subj.icon}</span>
                </div>
                <div className="subject-meta">
                  <span className={`badge ${a.badge}`}>{a.label}</span>
                  <span className="subject-score font-headline">{subj.score}%</span>
                </div>
              </div>
              <h4 className="t-h4">{subj.name}</h4>
              <div className="subject-input-group">
                <label className="input-label">Score Entry</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Enter marks"
                  defaultValue={subj.score}
                  onChange={(e) => handleInputChange(subj.id, e)}
                  id={`subject-score-${subj.id}`}
                />
              </div>
              <div className="progress-track">
                <div className={`progress-fill ${a.fill}`} style={{ width: `${subj.score}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
