/**
 * InsightCards — AI-generated insight alerts (warnings, successes, tips).
 * Uses colored accents and icons per the design system.
 */
import './InsightCards.css';

export default function InsightCards({ insights }) {
  return (
    <div className="insights-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="insights-header">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        <span className="t-eyebrow text-secondary font-headline">AI Insights</span>
      </div>

      {insights.map((insight, i) => (
        <div key={i} className={`insight-card insight-${insight.type}`}>
          {insight.type === 'warning' && <div className="insight-glow-error" />}
          <div className="insight-body">
            <span className={`material-symbols-outlined insight-icon insight-icon-${insight.type}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}>
              {insight.icon}
            </span>
            <div>
              <p className={`insight-title text-${insight.type === 'warning' ? 'error' : insight.type === 'success' ? 'tertiary' : 'primary'}`}>
                {insight.title}
              </p>
              <p className="insight-message">{insight.message}</p>
            </div>
          </div>
          {insight.tip && (
            <div className="insight-tip">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lightbulb</span>
              <span>Focus on <strong className="text-primary">{insight.tip.replace('Focus on ', '').replace(' this week.', '')}</strong> this week.</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
