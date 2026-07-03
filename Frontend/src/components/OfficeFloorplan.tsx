import React from 'react';
import { Lightbulb, Wind } from 'lucide-react';
import { Device } from '../types';

interface OfficeFloorplanProps {
  devices: Device[];
  onToggleDevice: (id: string) => void;
}

export default function OfficeFloorplan({ devices, onToggleDevice }: OfficeFloorplanProps) {
  const getRoomDevices = (room: Device['room']) =>
    devices.filter((device) => device.room === room);

  const renderDeviceButton = (device: Device) => {
    const isOn = device.status === 'ON';
    const Icon = device.type === 'fan' ? Wind : Lightbulb;

    return (
      <button
        key={device.id}
        onClick={() => onToggleDevice(device.id)}
        className={`h-12 min-w-12 px-2 rounded-lg transition-all active:scale-90 duration-100 flex flex-col items-center justify-center border ${
          isOn
            ? 'text-secondary glow-active bg-secondary/5 border-secondary/40'
            : 'text-on-surface-variant hover:text-on-surface bg-surface-container-low/40 border-outline-variant/40'
        }`}
        title={`${device.name}: ${device.status} (${isOn ? device.currentDraw : 0}W)`}
      >
        <Icon className={`w-5 h-5 ${device.type === 'fan' && isOn ? 'animate-spin-slow' : ''}`} />
        <span className="mt-1 max-w-14 truncate font-mono text-[8px] uppercase">
          {device.type === 'fan' ? 'Fan' : 'Light'}
        </span>
      </button>
    );
  };

  return (
    <section className="bg-surface-container p-4 rounded-xl border border-outline-variant relative overflow-hidden flex flex-col justify-between h-full text-on-surface">
      <div className="mb-4">
        <h2 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
          Office Layout
        </h2>
      </div>

      {/* Grid Blueprint Floor Plan */}
      <div className="relative w-full aspect-[16/10] bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 overflow-hidden">
        
        {/* Drawing Room Zone */}
        <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-lg p-3 relative flex flex-col items-center justify-center bg-surface-container/15 group/room transition-colors hover:bg-surface-container/20">
          <span className="absolute top-2 left-2 font-mono text-[9px] text-outline/60 tracking-wider">
            DRAWING ROOM
          </span>
          <div className="grid grid-cols-3 gap-3 z-10">
            {getRoomDevices('Drawing Room').map(renderDeviceButton)}
          </div>
        </div>

        {/* Work Room Combo Stack */}
        <div className="flex-[1.4] flex flex-col gap-3">
          
          {/* Work Room 1 */}
          <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-lg p-3 relative flex items-center justify-around bg-surface-container/15 group/room transition-colors hover:bg-surface-container/20">
            <span className="absolute top-2 left-2 font-mono text-[9px] text-outline/60 tracking-wider">
              WORK RM 1
            </span>
            <div className="grid grid-cols-5 gap-3 z-10">
              {getRoomDevices('Work Room 1').map(renderDeviceButton)}
            </div>
          </div>

          {/* Work Room 2 */}
          <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-lg p-3 relative flex items-center justify-around bg-surface-container/15 group/room transition-colors hover:bg-surface-container/20">
            <span className="absolute top-2 left-2 font-mono text-[9px] text-outline/60 tracking-wider">
              WORK RM 2
            </span>
            <div className="grid grid-cols-5 gap-3 z-10">
              {getRoomDevices('Work Room 2').map(renderDeviceButton)}
            </div>
          </div>
        </div>

        {/* Technical Dotted Accent Background Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#414754_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Floorplan Footer Navigation Tips */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-on-surface">
        <p className="text-[11px] text-on-surface-variant italic">
          Tip: Click device icons on floorplan for instant toggle
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.6)]" />
            <span className="text-[10px] uppercase font-bold text-outline font-mono tracking-wider">
              Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-outline-variant" />
            <span className="text-[10px] uppercase font-bold text-outline font-mono tracking-wider">
              Standby
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
