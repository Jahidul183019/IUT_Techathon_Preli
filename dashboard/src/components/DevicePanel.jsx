import './DevicePanel.css';

/**
 * Live Device Status Panel
 * Displays all 15 devices grouped by room (3 rooms × 5 devices).
 * Each device shows type icon, name, ON/OFF indicator, and wattage.
 */
export default function DevicePanel({ devices, onToggle }) {
  // Group devices by room
  const rooms = {};
  for (const d of devices) {
    if (!rooms[d.room]) rooms[d.room] = [];
    rooms[d.room].push(d);
  }

  const roomOrder = ['drawing_room', 'work_room_1', 'work_room_2'];
  const roomNames = {
    drawing_room: 'Drawing Room',
    work_room_1: 'Work Room 1',
    work_room_2: 'Work Room 2',
  };
  const roomEmojis = {
    drawing_room: '🛋️',
    work_room_1: '💼',
    work_room_2: '📐',
  };

  return (
    <div className="panel device-panel">
      <h2 className="panel-title">
        <span className="panel-icon">📡</span>
        Device Status
      </h2>

      {roomOrder.map(roomId => {
        const roomDevices = rooms[roomId] || [];
        const onCount = roomDevices.filter(d => d.status).length;

        return (
          <div key={roomId} className="room-group">
            <div className="room-header">
              <span className="room-emoji">{roomEmojis[roomId]}</span>
              <span className="room-name">{roomNames[roomId]}</span>
              <span className="room-count">
                {onCount}/{roomDevices.length} on
              </span>
            </div>

            <div className="device-grid">
              {roomDevices.map(device => (
                <button
                  key={device.id}
                  className={`device-card ${device.status ? 'on' : 'off'}`}
                  onClick={() => onToggle(device.id)}
                  title={`Click to toggle ${device.name}`}
                >
                  <div className="device-icon">
                    {device.type === 'fan' ? (
                      <svg className={`fan-svg ${device.status ? 'spinning' : ''}`} viewBox="0 0 24 24" width="28" height="28">
                        <path fill="currentColor" d="M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-4.74-.19a5 5 0 0 0-.26.19h-.01l-.01.01C5.13 12.6 3 14.08 3 16c0 1.47.84 2.77 2.13 3.41A3.98 3.98 0 0 0 9 21c1.21 0 2.37-.54 3.15-1.5.29.02.57.05.85.05 3.87 0 7-3.13 7-7 0-.34-.03-.67-.08-1H20c1.1 0 2-.9 2-2s-.9-2-2-2h-.68A6.97 6.97 0 0 0 15 3.05V3c0-1.1-.9-2-2-2s-2 .9-2 2v.05c-.32.06-.63.14-.93.24A5.01 5.01 0 0 0 7 1C5.34 1 4 2.34 4 4c0 1.29.81 2.39 1.96 2.81.56 1.2 1.34 2.26 2.3 3z"/>
                      </svg>
                    ) : (
                      <svg className="light-svg" viewBox="0 0 24 24" width="28" height="28">
                        <path fill="currentColor" d={device.status
                          ? "M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"
                          : "M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"
                        }/>
                      </svg>
                    )}
                  </div>
                  <div className="device-info">
                    <span className="device-name">
                      {device.type === 'fan' ? 'Fan' : 'Light'} {device.id.split('_').pop()}
                    </span>
                    <span className="device-watt">
                      {device.status ? `${device.wattage}W` : '0W'}
                    </span>
                  </div>
                  <div className={`status-dot ${device.status ? 'on' : 'off'}`} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
