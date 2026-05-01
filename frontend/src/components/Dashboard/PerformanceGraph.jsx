/**
 * PerformanceGraph — Renders the "Performance Trajectory" area chart
 * using Recharts with the Digital Oracle aesthetic.
 */
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './PerformanceGraph.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="perf-tooltip">
        <p className="perf-tooltip-label">{label}</p>
        <p className="perf-tooltip-value">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function PerformanceGraph({ data, average, predictedGrade, confidence }) {
  return (
    <div className="perf-graph-card glass-card animate-fade-in">
      <div className="perf-header">
        <div>
          <p className="t-eyebrow text-primary">Academic Pulse</p>
          <h2 className="t-h2" style={{ marginTop: '0.25rem' }}>
            Growth trajectory is <span className="text-tertiary">Ascending</span>
          </h2>
        </div>
      </div>

      <div className="perf-stats-row">
        <div className="perf-stat">
          <span className="t-muted">Average</span>
          <span className="t-stat text-primary">{average}%</span>
        </div>
        <div className="perf-stat">
          <span className="t-muted">Predicted</span>
          <span className="t-stat text-tertiary">{predictedGrade}</span>
        </div>
        <div className="perf-stat">
          <span className="t-muted">Confidence</span>
          <span className="t-stat text-secondary">{Math.round(confidence * 100)}%</span>
        </div>
      </div>

      <div className="perf-chart-wrap">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6dddff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6dddff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month" axisLine={false} tickLine={false}
              tick={{ fill: '#6b7094', fontSize: 12, fontFamily: 'Inter' }}
            />
            <YAxis
              domain={[40, 100]} axisLine={false} tickLine={false}
              tick={{ fill: '#6b7094', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="score"
              stroke="#6dddff" strokeWidth={2.5}
              fill="url(#perfGradient)"
              dot={{ r: 4, fill: '#0b0e14', stroke: '#6dddff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#6dddff', stroke: '#0b0e14', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
