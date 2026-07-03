import './AlertsPanel.css';

/**
 * Active Alerts Panel
 * Displays timestamped alerts, newest first.
 * Color-coded by severity: critical (red), warning (yellow), info (blue).
 */
export default function AlertsPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="panel alerts-panel">
        <h2 className="panel-title">
          <span className="panel-icon">🔔</span>
          Alerts
        </h2>
        <div className="alerts-empty">
          <span className="alerts-empty-icon">✅</span>
          <span>No active alerts</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel alerts-panel">
      <h2 className="panel-title">
        <span className="panel-icon">🔔</span>
        Alerts
        <span className="alert-badge">{alerts.length}</span>
      </h2>

      <div className="alerts-list">
        {alerts.map((alert, i) => (
          <div
            key={alert.id || i}
            className={`alert-item severity-${alert.severity || 'warning'}`}
          >
            <div className="alert-severity-bar" />
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
              <span className="alert-time">
                {formatTime(alert.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return ts;
  }
}
