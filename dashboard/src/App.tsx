import React, { useState } from 'react';
import { Device, Alert, ActiveTab } from './types';
import { useBackendDevices } from './hooks/useBackendDevices';
import TopNavBar from './components/TopNavBar';
import SideNavBar from './components/SideNavBar';
import PowerInsight from './components/PowerInsight';
import OfficeFloorplan from './components/OfficeFloorplan';
import AlertsPanel from './components/AlertsPanel';
import DeviceManagement from './components/DeviceManagement';
import MapView from './components/MapView';
import AnalyticsView from './components/AnalyticsView';
import SecurityView from './components/SecurityView';
import AddDeviceModal from './components/AddDeviceModal';
import SupportModal from './components/SupportModal';
import LogsModal from './components/LogsModal';
import { Home, Map, Bell, User, Plus } from 'lucide-react';

export default function App() {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const {
    devices,
    alerts,
    usage,
    wsStatus,
    error,
    isLoading,
    setAlerts,
    toggleDevice,
  } = useBackendDevices();

  // Modal Visibility controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Calculate dynamic metrics based on active devices (ON state)
  const activeLoad = usage?.total_watts ?? devices.reduce((sum, d) => sum + d.currentDraw, 0);
  const activeNodesCount = usage?.active_devices ?? devices.filter((d) => d.status === 'ON').length;
  const totalNodesCount = usage?.total_devices ?? devices.length;
  const estKwhToday = usage?.estimated_kwh_today ?? 0;
  const roomNamesList = usage?.rooms.map(r => r.room_name).join(', ') ?? 'Drawing Room, Work Room 1, Work Room 2';

  // Action: Toggle a device state ON/OFF
  const handleToggleDevice = (deviceId: string) => {
    toggleDevice(deviceId).catch(() => {
      triggerCustomAlert('warning', `Unable to toggle ${deviceId}. Check the backend connection.`);
    });
  };

  // Action: Add a custom device dynamically
  const handleAddDevice = (newDevice: Omit<Device, 'id' | 'lastActivity' | 'currentDraw'>) => {
    triggerCustomAlert(
      'info',
      `Device "${newDevice.name}" was not added. The backend currently uses a fixed ${totalNodesCount}-device inventory.`,
    );
  };

  // Action: Delete custom device
  const handleDeleteDevice = (deviceId: string) => {
    triggerCustomAlert(
      'info',
      `Device "${deviceId}" was not removed. Backend device inventory is fixed for this simulation.`,
    );
  };

  // Helper to trigger alert programmatically or via mock triggers
  const triggerCustomAlert = (level: Alert['level'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      level,
      timestamp,
      message,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  // Action: Dismiss a single alert
  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Action: Clear all alerts
  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  // Trigger test alerts from Simulator buttons
  const handleTriggerTestAlert = (level: Alert['level']) => {
    const templates = {
      critical: 'Demo alert: all devices in a room have been ON for more than 2 hours',
      warning: 'Demo alert: a light was left ON after office hours',
      info: 'Dashboard diagnostic: local alert rendering test completed',
    };
    triggerCustomAlert(level, templates[level]);
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Dynamic Top Navigation Bar */}
      <TopNavBar
        activeLoad={activeLoad}
        activeNodes={activeNodesCount}
        totalNodes={totalNodesCount}
        wsStatus={wsStatus}
        onNotificationsClick={() => {
          setActiveTab('dashboard');
          // Smooth scroll to Alerts panel if needed
          document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSettingsClick={() => setIsLogsModalOpen(true)}
        onProfileClick={() => setIsSupportModalOpen(true)}
        alertCount={alerts.length}
      />

      {/* Side Navigation Panel */}
      <SideNavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onAddDeviceClick={() => setIsAddModalOpen(true)}
        onSupportClick={() => setIsSupportModalOpen(true)}
        onLogsClick={() => setIsLogsModalOpen(true)}
        activeCount={activeNodesCount}
        totalCount={totalNodesCount}
      />

      {/* Primary Workspace Stage */}
      <main className="lg:ml-64 p-6 space-y-6 pb-28 lg:pb-8 transition-all">
        {error && (
          <div className="rounded-xl border border-error/40 bg-error-container/10 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-sm text-on-surface-variant">
            Loading live device state from the backend...
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Mission Control Grid Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
              
              {/* Left Column: Power Consumption Insights */}
              <section className="xl:col-span-3">
                <PowerInsight devices={devices} estKwhToday={estKwhToday} usage={usage} />
              </section>

              {/* Middle Column: Visual Office Floorplan layout */}
              <section className="xl:col-span-6">
                <OfficeFloorplan devices={devices} onToggleDevice={handleToggleDevice} />
              </section>

              {/* Right Column: Live Threat and Access Alerts */}
              <section id="alerts-section" className="xl:col-span-3">
                <AlertsPanel
                  alerts={alerts}
                  onDismissAlert={handleDismissAlert}
                  onClearAllAlerts={handleClearAllAlerts}
                  onTriggerTestAlert={handleTriggerTestAlert}
                />
              </section>
            </div>

            {/* Bottom Section: Full Device Inventory Toggles */}
            <DeviceManagement
              devices={devices}
              onToggleDevice={handleToggleDevice}
              onDeleteDevice={handleDeleteDevice}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>
        )}

        {/* Map View Section */}
        {activeTab === 'map' && (
          <MapView devices={devices} onToggleDevice={handleToggleDevice} />
        )}

        {/* Analytics Section */}
        {activeTab === 'analytics' && <AnalyticsView devices={devices} />}

        {activeTab === 'devices' && (
          <DeviceManagement
            devices={devices}
            onToggleDevice={handleToggleDevice}
            onDeleteDevice={handleDeleteDevice}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {/* Security Section */}
        {activeTab === 'security' && <SecurityView />}
      </main>

      {/* Bottom Nav Bar (Mobile Viewports Only) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-surface-container-high/95 backdrop-blur-lg border-t border-outline-variant z-50 rounded-t-xl shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-secondary bg-secondary-container/10 scale-95' : 'text-on-surface-variant'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
            activeTab === 'map' ? 'text-secondary bg-secondary-container/10 scale-95' : 'text-on-surface-variant'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Map</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('dashboard');
            setTimeout(() => {
              document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="flex flex-col items-center justify-center p-2 text-on-surface-variant relative"
        >
          <Bell className="w-5 h-5" />
          {alerts.length > 0 && <span className="absolute top-1.5 right-3 w-2 h-2 bg-error rounded-full status-pulse" />}
          <span className="text-[10px] font-bold mt-1">Alerts</span>
        </button>

        <button
          onClick={() => setIsSupportModalOpen(true)}
          className="flex flex-col items-center justify-center p-2 text-on-surface-variant"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Profile</span>
        </button>
      </nav>

      {/* Modal Dialog Panels */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDevice}
      />

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        activeLoad={activeLoad}
        deviceCount={totalNodesCount}
        roomNames={roomNamesList}
      />
    </div>
  );
}
