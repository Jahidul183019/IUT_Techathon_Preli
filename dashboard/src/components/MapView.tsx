import React, { useState } from 'react';
import { Map, Lightbulb, Wind, Power, Cpu, Compass, Plus, Minus } from 'lucide-react';
import { Device } from '../types';

interface MapViewProps {
  devices: Device[];
  onToggleDevice: (id: string) => void;
}

type DevicePosition = { x: number; y: number };
type RoomBox = {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
};

export default function MapView({ devices, onToggleDevice }: MapViewProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Desktop coordinates keep the wide topology used on larger screens.
  const desktopDevicePositions: Record<string, DevicePosition> = {
    dr_fan_1: { x: 18, y: 36 },
    dr_fan_2: { x: 30, y: 36 },
    dr_light_1: { x: 14, y: 61 },
    dr_light_2: { x: 24, y: 65 },
    dr_light_3: { x: 34, y: 61 },
    wr1_fan_1: { x: 57, y: 29 },
    wr1_fan_2: { x: 82, y: 29 },
    wr1_light_1: { x: 50, y: 39 },
    wr1_light_2: { x: 69, y: 37 },
    wr1_light_3: { x: 90, y: 39 },
    wr2_fan_1: { x: 57, y: 68 },
    wr2_fan_2: { x: 82, y: 68 },
    wr2_light_1: { x: 50, y: 78 },
    wr2_light_2: { x: 69, y: 76 },
    wr2_light_3: { x: 90, y: 78 },
  };

  // Mobile coordinates stack rooms vertically so fixed-size tap targets do not collide.
  const mobileDevicePositions: Record<string, DevicePosition> = {
    dr_fan_1: { x: 31, y: 17 },
    dr_fan_2: { x: 59, y: 17 },
    dr_light_1: { x: 21, y: 26 },
    dr_light_2: { x: 45, y: 27 },
    dr_light_3: { x: 69, y: 26 },
    wr1_fan_1: { x: 31, y: 48 },
    wr1_fan_2: { x: 59, y: 48 },
    wr1_light_1: { x: 21, y: 57 },
    wr1_light_2: { x: 45, y: 58 },
    wr1_light_3: { x: 69, y: 57 },
    wr2_fan_1: { x: 31, y: 79 },
    wr2_fan_2: { x: 59, y: 79 },
    wr2_light_1: { x: 21, y: 88 },
    wr2_light_2: { x: 45, y: 89 },
    wr2_light_3: { x: 69, y: 88 },
  };

  const desktopRooms: RoomBox[] = [
    { label: 'Drawing Zone', x: 5, y: 15, width: 35, height: 70, labelX: 8, labelY: 18 },
    { label: 'Work Rm 1', x: 45, y: 15, width: 50, height: 32, labelX: 48, labelY: 18 },
    { label: 'Work Rm 2', x: 45, y: 53, width: 50, height: 32, labelX: 48, labelY: 56 },
  ];

  const mobileRooms: RoomBox[] = [
    { label: 'Drawing Zone', x: 7, y: 5, width: 86, height: 28, labelX: 12, labelY: 8 },
    { label: 'Work Rm 1', x: 7, y: 36, width: 86, height: 28, labelX: 12, labelY: 39 },
    { label: 'Work Rm 2', x: 7, y: 67, width: 86, height: 28, labelX: 12, labelY: 70 },
  ];

  const renderDeviceIcon = (device: Device) => {
    switch (device.type) {
      case 'light':
        return <Lightbulb className="w-4 h-4" />;
      case 'fan':
        return <Wind className="w-4 h-4" />;
      case 'ac':
        return <Wind className="w-4 h-4 rotate-90" />;
      case 'outlet':
        return <Power className="w-4 h-4" />;
      case 'sensor':
        return <Cpu className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const renderTopologyCanvas = (
    positions: Record<string, DevicePosition>,
    rooms: RoomBox[],
    variant: 'mobile' | 'desktop',
  ) => {
    const isMobile = variant === 'mobile';

    return (
      <div
        className={`relative w-full bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden group ${
          isMobile ? 'h-[460px]' : 'aspect-[16/9]'
        }`}
      >
        {/* Scale transformation wrapper based on zoom */}
        <div
          className="absolute inset-0 transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {/* Background Technical Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.12] bg-[linear-gradient(to_right,#8b90a0_1px,transparent_1px),linear-gradient(to_bottom,#8b90a0_1px,transparent_1px)] [background-size:24px_24px]" />
          )}

          {/* Compartment room dividers overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-outline-variant/30 stroke-[1.5] fill-none">
            {rooms.map((room) => (
              <rect
                key={room.label}
                x={`${room.x}%`}
                y={`${room.y}%`}
                width={`${room.width}%`}
                height={`${room.height}%`}
                rx="8"
                strokeDasharray="4 4"
              />
            ))}
          </svg>

          {/* Room Labels */}
          {rooms.map((room) => (
            <div
              key={room.label}
              className="absolute font-mono text-[10px] text-outline/40 uppercase font-black tracking-widest"
              style={{ top: `${room.labelY}%`, left: `${room.labelX}%` }}
            >
              {room.label}
            </div>
          ))}

          {/* Compass Node Icon */}
          <div
            className={`absolute text-outline/35 pointer-events-none flex items-center gap-1 ${
              isMobile ? 'bottom-3 right-3' : 'bottom-4 right-4'
            }`}
          >
            <Compass className="w-5 h-5 animate-spin-slow" />
            {!isMobile && (
              <span className="font-mono text-[9px] uppercase tracking-wider">SEC-GRID SEC-01</span>
            )}
          </div>

          {/* Map Nodes (Interactive Devices) */}
          {devices.map((device) => {
            const pos = positions[device.id];
            if (!pos) return null; // Only render nodes for specified layout positions

            const isOn = device.status === 'ON';
            const nodeColor = isOn
              ? 'bg-secondary text-on-secondary shadow-[0_0_15px_rgba(78,222,163,0.5)] border-secondary'
              : 'bg-surface-variant border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface';

            return (
              <button
                key={device.id}
                onClick={() => onToggleDevice(device.id)}
                className={`absolute rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-20 ${nodeColor} ${
                  isMobile ? 'w-9 h-9' : 'w-10 h-10'
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${device.name} (${device.room}) - ${device.status}`}
              >
                {/* Outer pulsing ring for active nodes */}
                {isOn && (
                  <span className="absolute inset-0 w-full h-full rounded-full bg-secondary/30 animate-ping -z-10" />
                )}
                {renderDeviceIcon(device)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface-container p-4 sm:p-6 rounded-xl border border-outline-variant space-y-5 sm:space-y-6 text-on-surface">
      {/* Header and Controls */}
      <div className="flex min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-sans text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2 leading-tight">
            <Map className="w-5 h-5 text-primary shrink-0" />
            <span className="min-w-0">Workspace Topology Map</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            Spatial monitoring of active hardware nodes across HQ Alpha Office Rooms
          </p>
        </div>

        {/* Map Control Buttons */}
        <div className="flex w-full flex-wrap items-center gap-2 self-start sm:w-auto sm:flex-nowrap sm:self-center">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`h-9 flex-1 whitespace-nowrap px-3 font-mono text-[10px] uppercase rounded border transition-all sm:flex-none ${
              showGrid
                ? 'bg-primary/20 border-primary text-primary font-bold'
                : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
            }`}
          >
            Grid Overlay
          </button>

          <div className="flex h-9 shrink-0 items-center bg-surface-container-low border border-outline-variant rounded px-1.5 py-1">
            <button
              onClick={() => setZoom(Math.max(60, zoom - 10))}
              className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-on-surface"
              title="Zoom Out"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] px-2 text-on-surface-variant min-w-[35px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(140, zoom + 10))}
              className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-on-surface"
              title="Zoom In"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Blueprint Visual Box */}
      <div className="sm:hidden">
        {renderTopologyCanvas(mobileDevicePositions, mobileRooms, 'mobile')}
      </div>
      <div className="hidden sm:block">
        {renderTopologyCanvas(desktopDevicePositions, desktopRooms, 'desktop')}
      </div>

      {/* Map Legend */}
      <div className="p-3 sm:p-4 bg-surface-container-low rounded-lg border border-outline-variant/50 flex flex-wrap gap-4 sm:gap-6 items-center justify-between">
        <div className="flex min-w-0 flex-1 gap-x-4 gap-y-3 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.5)]" />
            <span className="font-mono text-on-surface-variant font-bold uppercase text-[10px]">Node Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-surface-variant border border-outline-variant" />
            <span className="font-mono text-on-surface-variant font-bold uppercase text-[10px]">Node Standby</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="border-b border-dashed border-outline-variant/60 w-6 h-[2px]" />
            <span className="font-mono text-on-surface-variant font-bold uppercase text-[10px]">Office Divider Walls</span>
          </div>
        </div>
        <p className="w-full sm:w-auto text-[10px] text-outline font-mono italic leading-relaxed sm:text-right">
          Click any circular map node directly to trigger local mechanical relay toggling
        </p>
      </div>
    </div>
  );
}
