/**
 * ActionPlan — Displays the ML-recommended action items with
 * a visually engaging checklist-style layout.
 */
import './ActionPlan.css';

export default function ActionPlan({ items, predictedGrade }) {
  return (
    <div className="action-plan glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="action-plan-header">
        <div>
          <p className="t-eyebrow text-secondary">Recommended Action Plan</p>
          <h3 className="t-h3" style={{ marginTop: '0.25rem' }}>Your Personalized Roadmap</h3>
        </div>
        <div className="predicted-badge">
          <span className="predicted-label">Predicted</span>
          <span className="predicted-grade">{predictedGrade}</span>
        </div>
      </div>

      <div className="action-list">
        {items.map((item, i) => (
          <div key={i} className="action-item" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
            <div className="action-number">{String(i + 1).padStart(2, '0')}</div>
            <p className="action-text">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
