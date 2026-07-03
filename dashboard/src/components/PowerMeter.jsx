import './PowerMeter.css';

/**
 * Live Power Meter
 * Shows total watts across all rooms + per-room breakdown with visual bars.
 */
export default function PowerMeter({ usage }) {
  if (!usage) return null;

  // Max possible: 3 rooms × (2×75W fans + 3×10W lights) = 3 × 180W = 540W
  const MAX_WATTS = 540;
  const totalPercent = Math.round((usage.total_watts / MAX_WATTS) * 100);

  // Color based on load percentage
  const getBarColor = (percent) => {
    if (percent > 80) return 'var(--error)';
    if (percent > 50) return 'var(--yellow)';
    return 'var(--success)';
  };

  return (
    <div className="panel power-panel">
      <h2 className="panel-title">
        <span className="panel-icon">⚡</span>
        Power Meter
      </h2>

      {/* Total power */}
      <div className="total-power">
        <div className="total-watts">
          <span className="watts-value">{usage.total_watts}</span>
          <span className="watts-unit">W</span>
        </div>
        <div className="total-meta">
          {usage.active_devices}/{usage.total_devices} devices active
        </div>
        <div className="power-bar-track">
          <div
            className="power-bar-fill total-bar"
            style={{
              width: `${totalPercent}%`,
              background: getBarColor(totalPercent),
            }}
          />
        </div>
        <div className="power-bar-label">
          {totalPercent}% of {MAX_WATTS}W capacity
        </div>
      </div>

      {/* Per-room breakdown */}
      <div className="room-breakdown">
        {usage.rooms && usage.rooms.map(room => {
          const roomMax = 180; // 2×75 + 3×10
          const roomPercent = Math.round((room.current_watts / roomMax) * 100);

          return (
            <div key={room.room_id} className="room-power">
              <div className="room-power-header">
                <span className="room-power-name">{room.room_name}</span>
                <span className="room-power-watts">
                  {room.current_watts}W
                  <span className="room-power-active">
                    ({room.active_devices}/{room.total_devices})
                  </span>
                </span>
              </div>
              <div className="power-bar-track small">
                <div
                  className="power-bar-fill"
                  style={{
                    width: `${roomPercent}%`,
                    background: getBarColor(roomPercent),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
