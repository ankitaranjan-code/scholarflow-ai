/**
 * SubjectCards — Grid of subject score cards with progress bars.
 * Now fires onScoreChange callback to trigger ML prediction.
 */
import './SubjectCards.css';

const accentMap = {
  new: { fill: 'fill-primary', badge: 'badge-primary', label: 'New' },
  error: { fill: 'fill-error', badge: 'badge-error', label: 'Critical' },
  primary: { fill: 'fill-primary', badge: 'badge-primary', label: 'Steady' },
  secondary: { fill: 'fill-secondary', badge: 'badge-secondary', label: 'Good' },
  tertiary: { fill: 'fill-tertiary', badge: 'badge-tertiary', label: 'Peak' },
};

export default function SubjectCards({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="subject-section animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <h3 className="t-h3">Current Subjects</h3>
        <p className="t-muted">No subject data logged yet. Click 'Log Progress' to get started.</p>
      </div>
    );
  }

  return (
    <div className="subject-section animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <div className="subject-section-header">
        <div>
          <h3 className="t-h3">Current Subjects</h3>
          <p className="t-muted">Latest performance across all modules</p>
        </div>
      </div>

      <div className="subjects-grid">
        {subjects.map((subj) => {
          const a = accentMap[subj.color_accent] || accentMap.primary;
          // Subj from API: subject_name, percentage, status, color_accent, icon_name
          return (
            <div key={subj.id} className={`subject-card subject-border-${subj.color_accent}`}>
              <div className="subject-card-header">
                <div className={`subject-icon-wrap icon-${subj.color_accent}`}>
                  <span className="material-symbols-outlined">{subj.icon_name || 'book'}</span>
                </div>
                <div className="subject-meta">
                  <span className={`badge ${a.badge}`}>{subj.status.toUpperCase()}</span>
                  <span className="subject-score font-headline">{subj.percentage}%</span>
                </div>
              </div>
              <h4 className="t-h4" style={{ marginBottom: '1rem' }}>{subj.subject_name}</h4>
              <div className="progress-track">
                <div className={`progress-fill ${a.fill}`} style={{ width: `${subj.percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
