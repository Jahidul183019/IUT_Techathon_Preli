import React from 'react';
import { Lightbulb, Wind, Monitor, Coffee, Armchair } from 'lucide-react';
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
        className={`aspect-square w-full rounded-lg transition-all active:scale-90 duration-100 flex flex-col items-center justify-center border ${
          isOn
            ? 'text-secondary glow-active bg-secondary/5 border-secondary/40'
            : 'text-on-surface-variant hover:text-on-surface bg-surface-container-low/40 border-outline-variant/40'
        }`}
        title={`${device.name}: ${device.status} (${isOn ? device.currentDraw : 0}W)`}
      >
        <Icon className={`w-5 h-5 ${device.type === 'fan' && isOn ? 'animate-spin-slow' : ''}`} />
        <span className="mt-1 w-[90%] truncate font-mono text-[8px] uppercase">
          {device.type === 'fan' ? 'Fan' : 'Light'}
        </span>
      </button>
    );
  };

  const renderAsset = (type: 'desk' | 'sofa' | 'coffee', label: string, keyId: string) => (
    <div
      key={keyId}
      className="aspect-square w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest/30 flex flex-col items-center justify-center text-outline/40 pointer-events-none"
    >
      {type === 'desk' && <Monitor className="w-4 h-4 mb-1" />}
      {type === 'sofa' && <Armchair className="w-4 h-4 mb-1" />}
      {type === 'coffee' && <Coffee className="w-4 h-4 mb-1" />}
      <span className="font-mono text-[8px] uppercase">{label}</span>
    </div>
  );

  return (
    <section className="bg-surface-container p-4 rounded-xl border border-outline-variant relative overflow-hidden flex flex-col justify-between h-full text-on-surface">
      <div className="mb-4">
        <h2 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
          Office Layout
        </h2>
      </div>

      {/* Grid Blueprint Floor Plan */}
      <div className="relative w-full min-h-[300px] bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-3 sm:p-5 flex flex-col sm:flex-row gap-3 overflow-hidden">
        
        {/* Drawing Room Zone (Waiting Area) */}
        <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-lg p-3 relative flex flex-col items-center justify-center bg-surface-container/15 group/room transition-colors hover:bg-surface-container/20">
          <span className="absolute top-2 left-2 font-mono text-[9px] text-outline/60 tracking-wider">
            DRAWING ROOM
          </span>
          <div className="grid grid-cols-3 gap-2 z-10 w-full mt-4 max-w-[200px]">
            {/* Devices mixed with Assets dynamically */}
            {renderAsset('sofa', 'Sofa', 's1')}
            {getRoomDevices('Drawing Room').map(renderDeviceButton)}
            {renderAsset('coffee', 'Table', 'c1')}
          </div>
        </div>
          
        {/* Work Room 1 */}
        <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-lg p-3 relative flex flex-col items-center justify-center bg-surface-container/15 group/room transition-colors hover:bg-surface-container/20">
          <span className="absolute top-2 left-2 font-mono text-[9px] text-outline/60 tracking-wider">
            WORK ROOM 1
          </span>
          <div className="grid grid-cols-3 gap-2 z-10 w-full mt-4 max-w-[200px]">
            {renderAsset('desk', 'Desk', 'd1')}
            {renderAsset('desk', 'Desk', 'd2')}
            {getRoomDevices('Work Room 1').map(renderDeviceButton)}
            {renderAsset('desk', 'Desk', 'd3')}
            {renderAsset('desk', 'Desk', 'd4')}
          </div>
        </div>

        {/* Work Room 2 */}
        <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-lg p-3 relative flex flex-col items-center justify-center bg-surface-container/15 group/room transition-colors hover:bg-surface-container/20">
          <span className="absolute top-2 left-2 font-mono text-[9px] text-outline/60 tracking-wider">
            WORK ROOM 2
          </span>
          <div className="grid grid-cols-3 gap-2 z-10 w-full mt-4 max-w-[200px]">
            {renderAsset('desk', 'Desk', 'd5')}
            {renderAsset('desk', 'Desk', 'd6')}
            {getRoomDevices('Work Room 2').map(renderDeviceButton)}
            {renderAsset('desk', 'Desk', 'd7')}
            {renderAsset('desk', 'Desk', 'd8')}
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
