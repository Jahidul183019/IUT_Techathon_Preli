import { useState } from 'react';
import './OfficeLayout.css';

/**
 * Top-down SVG Office Layout
 * Renders 3 rooms side-by-side with decorative furniture.
 * Places devices within rooms. Lights glow when ON, fans spin when ON.
 */
export default function OfficeLayout({ devices, onToggle }) {
  const [tooltip, setTooltip] = useState(null);

  // Group devices by ID for easy lookup
  const deviceMap = {};
  for (const d of devices) {
    deviceMap[d.id] = d;
  }

  // Handle mouse events for the custom tooltip
  const handleMouseEnter = (e, device) => {
    if (!device) return;
    
    // Format timestamp nicely
    let timeStr = 'Unknown';
    if (device.last_changed) {
      try {
        const d = new Date(device.last_changed);
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch (e) {
        timeStr = device.last_changed;
      }
    }

    setTooltip({
      name: device.name,
      status: device.status ? 'ON' : 'OFF',
      wattage: device.status ? device.wattage : 0,
      time: timeStr,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e) => {
    if (tooltip) {
      setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Helper to render a fan icon at cx, cy
  const renderFan = (id, cx, cy) => {
    const dev = deviceMap[id];
    if (!dev) return null;
    const isOn = dev.status;

    return (
      <g
        className="svg-device"
        transform={`translate(${cx}, ${cy})`}
        onMouseEnter={(e) => handleMouseEnter(e, dev)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onToggle && onToggle(dev.id)}
      >
        <circle cx="0" cy="0" r="18" className={`device-bg ${isOn ? 'on' : 'off'}`} />
        <g className={`fan-blades ${isOn ? 'spinning' : ''}`}>
          <circle cx="0" cy="0" r="3" className="fan-center" />
          <ellipse cx="0" cy="-8" rx="3.5" ry="7" className="fan-blade" />
          <ellipse cx="-7" cy="4" rx="3.5" ry="7" className="fan-blade" transform="rotate(120 0 0)" />
          <ellipse cx="7" cy="4" rx="3.5" ry="7" className="fan-blade" transform="rotate(240 0 0)" />
        </g>
      </g>
    );
  };

  // Helper to render a light icon at cx, cy
  const renderLight = (id, cx, cy) => {
    const dev = deviceMap[id];
    if (!dev) return null;
    const isOn = dev.status;

    return (
      <g
        className="svg-device"
        transform={`translate(${cx}, ${cy})`}
        onMouseEnter={(e) => handleMouseEnter(e, dev)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onToggle && onToggle(dev.id)}
      >
        <circle cx="0" cy="0" r="14" className="device-bg transparent" />
        <circle 
          cx="0" 
          cy="0" 
          r="8" 
          className={`light-bulb ${isOn ? 'glowing' : ''}`} 
        />
      </g>
    );
  };

  return (
    <div className="panel office-layout-panel">
      <h2 className="panel-title">
        <span className="panel-icon">🗺️</span>
        Live Office View
      </h2>

      <div className="svg-container">
        <svg viewBox="0 0 900 420" className="office-svg">
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1"/>
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width="900" height="400" fill="url(#gridPattern)" />

          {/* Exterior Walls */}
          <rect x="10" y="10" width="880" height="380" className="wall exterior" />

          {/* Interior Walls */}
          <line x1="300" y1="10" x2="300" y2="390" className="wall interior" />
          <line x1="600" y1="10" x2="600" y2="390" className="wall interior" />

          {/* Room Labels */}
          <text x="155" y="40" className="room-text">Drawing Room</text>
          <text x="450" y="40" className="room-text">Work Room 1</text>
          <text x="745" y="40" className="room-text">Work Room 2</text>

          {/* === DRAWING ROOM (x:10-300) === */}
          <g className="furniture">
            {/* Sofa */}
            <rect x="50" y="80" width="160" height="60" rx="10" className="furn-shape" />
            <rect x="60" y="100" width="140" height="30" rx="5" className="furn-detail" />
            {/* Coffee Table */}
            <circle cx="130" cy="190" r="35" className="furn-shape" />
            <circle cx="130" cy="190" r="25" className="furn-detail" />
            {/* Armchair */}
            <rect x="200" y="250" width="50" height="50" rx="8" className="furn-shape" />
          </g>

          {/* Drawing Room Devices */}
          {renderLight('dr_light_1', 155, 90)}
          {renderFan('dr_fan_1', 100, 160)}
          {renderFan('dr_fan_2', 210, 160)}
          {renderLight('dr_light_2', 80, 270)}
          {renderLight('dr_light_3', 230, 270)}


          {/* === WORK ROOM 1 (x:300-600) === */}
          <g className="furniture">
            {/* Desks top row */}
            <rect x="340" y="100" width="90" height="50" rx="4" className="furn-shape desk" />
            <rect x="470" y="100" width="90" height="50" rx="4" className="furn-shape desk" />
            {/* Desks bottom row */}
            <rect x="340" y="240" width="90" height="50" rx="4" className="furn-shape desk" />
            <rect x="470" y="240" width="90" height="50" rx="4" className="furn-shape desk" />
            {/* Desk chairs */}
            <circle cx="385" cy="165" r="10" className="furn-detail chair" />
            <circle cx="515" cy="165" r="10" className="furn-detail chair" />
            <circle cx="385" cy="225" r="10" className="furn-detail chair" />
            <circle cx="515" cy="225" r="10" className="furn-detail chair" />
          </g>

          {/* Work Room 1 Devices */}
          {renderLight('wr1_light_1', 450, 75)}
          {renderFan('wr1_fan_1', 385, 175)}
          {renderFan('wr1_fan_2', 515, 175)}
          {renderLight('wr1_light_2', 385, 300)}
          {renderLight('wr1_light_3', 515, 300)}


          {/* === WORK ROOM 2 (x:600-890) === */}
          <g className="furniture">
            {/* Large central meeting table */}
            <rect x="680" y="120" width="140" height="70" rx="35" className="furn-shape desk" />
            {/* Meeting chairs */}
            <circle cx="710" cy="100" r="12" className="furn-detail chair" />
            <circle cx="750" cy="100" r="12" className="furn-detail chair" />
            <circle cx="790" cy="100" r="12" className="furn-detail chair" />
            <circle cx="710" cy="210" r="12" className="furn-detail chair" />
            <circle cx="750" cy="210" r="12" className="furn-detail chair" />
            <circle cx="790" cy="210" r="12" className="furn-detail chair" />
            
            {/* Side desk */}
            <rect x="630" y="280" width="100" height="40" rx="4" className="furn-shape desk" />
          </g>

          {/* Work Room 2 Devices */}
          {renderLight('wr2_light_1', 750, 75)}
          {renderFan('wr2_fan_1', 710, 155)}
          {renderFan('wr2_fan_2', 790, 155)}
          {renderLight('wr2_light_2', 680, 270)}
          {renderLight('wr2_light_3', 820, 270)}


          {/* === ENTRY ARROW === */}
          <g className="entry-arrow" transform="translate(450, 415)">
            <path d="M 0 0 L 0 -25" stroke="var(--accent)" strokeWidth="3" strokeDasharray="4 2" />
            <polygon points="-6,-15 6,-15 0,-25" fill="var(--accent)" />
            <text x="12" y="-12" className="entry-text">ENTRY</text>
          </g>
        </svg>

        {/* Custom Tooltip */}
        {tooltip && (
          <div 
            className="device-tooltip"
            style={{ 
              left: tooltip.x + 15, 
              top: tooltip.y + 15 
            }}
          >
            <div className="tt-name">{tooltip.name}</div>
            <div className="tt-row">
              <span className="tt-label">Status:</span>
              <span className={`tt-val ${tooltip.status === 'ON' ? 'text-success' : 'text-dim'}`}>
                {tooltip.status}
              </span>
            </div>
            <div className="tt-row">
              <span className="tt-label">Usage:</span>
              <span className="tt-val">{tooltip.wattage}W</span>
            </div>
            <div className="tt-row">
              <span className="tt-label">Updated:</span>
              <span className="tt-val">{tooltip.time}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
