import { useDeviceSocket } from './hooks/useDeviceSocket';
import DevicePanel from './components/DevicePanel';
import PowerMeter from './components/PowerMeter';
import AlertsPanel from './components/AlertsPanel';
import OfficeLayout from './components/OfficeLayout';
import './App.css';

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
