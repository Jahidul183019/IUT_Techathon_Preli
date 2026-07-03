import { useDeviceSocket } from './hooks/useDeviceSocket';
import DevicePanel from './components/DevicePanel';
import PowerMeter from './components/PowerMeter';
import AlertsPanel from './components/AlertsPanel';
import OfficeLayout from './components/OfficeLayout';
import './App.css';

// Live hardware demo (Wokwi ESP32 simulation — see circuit/circuit_design.md)
const WOKWI_DEMO_URL = 'https://wokwi.com/projects/468536088941998081';

function App() {
  const { devices, usage, alerts, wsStatus, toggleDevice } = useDeviceSocket();

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="title-icon">🏠</span>
            Smart Home Monitor
          </h1>
          <p className="app-subtitle">Real-time IoT Dashboard</p>
        </div>
        <div className="header-right">
          <a
            className="wokwi-pill"
            href={WOKWI_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open the ESP32 + relay + ACS712 circuit on Wokwi"
          >
            <span className="wokwi-icon" aria-hidden="true">🔌</span>
            <span className="wokwi-label">View Live Hardware</span>
            <span className="wokwi-ext" aria-hidden="true">↗</span>
          </a>
          <div className={`ws-badge ${wsStatus}`}>
            <span className="ws-dot" />
            <span className="ws-label">{wsStatus}</span>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="dashboard-grid">
        {/* Left column */}
        <div className="col-left">
          <PowerMeter usage={usage} />
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Right column */}
        <div className="col-right">
          <DevicePanel devices={devices} onToggle={toggleDevice} />
        </div>

        {/* Full-width floor plan */}
        <div className="col-full">
          <OfficeLayout devices={devices} onToggle={toggleDevice} />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>IUT Techathon · IoT Smart Home Monitor</span>
        <span className="footer-devices">{devices.length} devices tracked</span>
      </footer>
    </div>
  );
}

export default App;
