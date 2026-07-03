import React, { useState } from 'react';
import { Lightbulb, Wind, Power, Cpu, Trash2, Plus } from 'lucide-react';
import { Device } from '../types';

interface DeviceManagementProps {
  devices: Device[];
  onToggleDevice: (id: string) => void;
  onDeleteDevice: (id: string) => void;
  onOpenAddModal: () => void;
}

export default function DeviceManagement({
  devices,
  onToggleDevice,
  onDeleteDevice,
  onOpenAddModal,
}: DeviceManagementProps) {
  const [selectedRoom, setSelectedRoom] = useState<'All' | 'Drawing Room' | 'Work Room 1' | 'Work Room 2'>('All');

  // Rooms list
  const rooms = ['All', 'Drawing Room', 'Work Room 1', 'Work Room 2'] as const;

  // Filter devices based on chosen room tab
  const filteredDevices = devices.filter((d) => {
    if (selectedRoom === 'All') return true;
    return d.room === selectedRoom;
  });

  // Group devices by room for logical organization when showing 'All'
  const roomsToRender = selectedRoom === 'All'
    ? (['Drawing Room', 'Work Room 1', 'Work Room 2'] as const)
    : ([selectedRoom] as const);

  // Helper to render specific device icons
  const renderDeviceIcon = (device: Device) => {
    const isOn = device.status === 'ON';
    const activeColor = isOn ? 'text-secondary' : 'text-on-surface-variant';
    
    switch (device.type) {
      case 'light':
        return <Lightbulb className={`w-5 h-5 ${activeColor}`} />;
      case 'fan':
        return <Wind className={`w-5 h-5 ${activeColor} ${isOn ? 'animate-spin-slow' : ''}`} />;
      case 'ac':
        return <Wind className={`w-5 h-5 ${activeColor} rotate-90 ${isOn ? 'animate-pulse' : ''}`} />;
      case 'outlet':
        return <Power className={`w-5 h-5 ${activeColor}`} />;
      case 'sensor':
        return <Cpu className={`w-5 h-5 ${activeColor}`} />;
      default:
        return <Cpu className={`w-5 h-5 ${activeColor}`} />;
    }
  };

  return (
    <section className="space-y-6 text-on-surface">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-sans text-xl font-bold text-on-surface tracking-tight">
          Device Management
        </h2>
        
        {/* Add Quick-Action Device Button for Mobile Viewports */}
        <button
          onClick={() => onOpenAddModal()}
          className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary font-bold text-xs font-mono rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Device
        </button>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-outline-variant/30">
        {rooms.map((room) => {
          const isSelected = selectedRoom === room;
          return (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-4 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                  : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              {room === 'All' ? 'All Rooms' : room}
            </button>
          );
        })}
      </div>

      {/* Devices Groups Grid */}
      <div className="space-y-8">
        {roomsToRender.map((roomName) => {
          const roomDevices = filteredDevices.filter((d) => d.room === roomName);
          
          if (roomDevices.length === 0) return null;

          return (
            <div key={roomName} className="space-y-4">
              {/* Room Section Divider */}
              <div className="flex items-center gap-4">
                <span className="h-[1px] flex-1 bg-outline-variant/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-outline">
                  {roomName} Inventory
                </span>
                <span className="h-[1px] flex-1 bg-outline-variant/30" />
              </div>

              {/* Grid of Devices in Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {roomDevices.map((device) => {
                  const isOn = device.status === 'ON';
                  const isCustom = device.id.startsWith('custom-');

                  return (
                    <div
                      key={device.id}
                      className="bg-surface-container p-4 rounded-xl border border-outline-variant hover:border-primary/50 transition-all duration-200 group relative flex flex-col justify-between"
                    >
                      {/* Top Header Card */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center">
                          {renderDeviceIcon(device)}
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono text-[10px] font-bold tracking-wider ${
                              isOn ? 'text-secondary' : 'text-on-surface-variant'
                            }`}
                          >
                            {device.status}
                          </span>
                          <span className="font-mono text-[10px] text-outline">
                            {isOn ? `${device.currentDraw}W` : '0W'}
                          </span>
                        </div>
                      </div>

                      {/* Device Card Info */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center pr-2">
                          <h3 className="font-bold text-on-surface text-sm sm:text-base tracking-tight">
                            {device.name}
                          </h3>
                          {/* Allow deleting custom added devices */}
                          {isCustom && (
                            <button
                              onClick={() => onDeleteDevice(device.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all rounded-md"
                              title="Delete Device"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Last activity: {device.lastActivity}
                        </p>
                      </div>

                      {/* Toggle Button Action */}
                      <button
                        onClick={() => onToggleDevice(device.id)}
                        className={`w-full py-2 border rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold active:scale-[0.98] transition-all duration-100 cursor-pointer ${
                          isOn
                            ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_8px_rgba(78,222,163,0.15)] hover:bg-secondary/25'
                            : 'bg-surface-variant border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
                        }`}
                      >
                        Toggle State
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
