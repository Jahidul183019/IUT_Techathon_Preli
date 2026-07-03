import './FloorPlan.css';

/**
 * Top-down SVG/CSS floor plan of the 3 rooms.
 * - Light icons glow when ON
 * - Fan icons spin when ON
 * - Click any device to toggle it
 */
export default function FloorPlan({ devices, onToggle }) {
  // Group by room
  const rooms = {};
  for (const d of devices) {
    if (!rooms[d.room]) rooms[d.room] = [];
    rooms[d.room].push(d);
  }

  const roomConfig = [
    { id: 'drawing_room', name: 'Drawing Room', emoji: '🛋️', className: 'room-drawing' },
    { id: 'work_room_1', name: 'Work Room 1', emoji: '💼', className: 'room-work1' },
    { id: 'work_room_2', name: 'Work Room 2', emoji: '📐', className: 'room-work2' },
  ];

  return (
    <div className="panel floor-panel">
      <h2 className="panel-title">
        <span className="panel-icon">🏠</span>
        Floor Plan
      </h2>

      <div className="floor-layout">
        {roomConfig.map(rc => {
          const roomDevices = rooms[rc.id] || [];
          const fans = roomDevices.filter(d => d.type === 'fan');
          const lights = roomDevices.filter(d => d.type === 'light');

          return (
            <div key={rc.id} className={`floor-room ${rc.className}`}>
              <div className="floor-room-label">
                <span>{rc.emoji}</span>
                <span>{rc.name}</span>
              </div>

              <div className="floor-devices">
                {/* Fans on left side */}
                <div className="floor-fans">
                  {fans.map(fan => (
                    <button
                      key={fan.id}
                      className={`floor-device floor-fan ${fan.status ? 'on' : 'off'}`}
                      onClick={() => onToggle(fan.id)}
                      title={`${fan.name}: ${fan.status ? 'ON' : 'OFF'}`}
                    >
                      <svg
                        className={`floor-fan-icon ${fan.status ? 'spinning' : ''}`}
                        viewBox="0 0 32 32"
                        width="24"
                        height="24"
                      >
                        {/* 3-blade fan */}
                        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
                        <ellipse cx="16" cy="7" rx="3" ry="7" fill="currentColor" opacity="0.85" />
                        <ellipse cx="8.2" cy="21" rx="3" ry="7" fill="currentColor" opacity="0.85" transform="rotate(120 16 16)" />
                        <ellipse cx="23.8" cy="21" rx="3" ry="7" fill="currentColor" opacity="0.85" transform="rotate(240 16 16)" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Lights on right side */}
                <div className="floor-lights">
                  {lights.map(light => (
                    <button
                      key={light.id}
                      className={`floor-device floor-light ${light.status ? 'on' : 'off'}`}
                      onClick={() => onToggle(light.id)}
                      title={`${light.name}: ${light.status ? 'ON' : 'OFF'}`}
                    >
                      <div className={`light-circle ${light.status ? 'glowing' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="floor-legend">
        <span className="legend-item">
          <span className="legend-fan-icon">⟲</span> Fan
        </span>
        <span className="legend-item">
          <span className="legend-light-icon">●</span> Light
        </span>
        <span className="legend-item on">
          <span className="legend-dot on" /> ON
        </span>
        <span className="legend-item off">
          <span className="legend-dot off" /> OFF
        </span>
      </div>
    </div>
  );
}
