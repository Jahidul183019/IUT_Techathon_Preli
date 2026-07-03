import React, { useState } from 'react';
import { Map, Lightbulb, Wind, Power, Cpu, Layers, Compass, Plus, Minus } from 'lucide-react';
import { Device } from '../types';

interface MapViewProps {
  devices: Device[];
  onToggleDevice: (id: string) => void;
}

export default function MapView({ devices, onToggleDevice }: MapViewProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Map device IDs to visual coordinate positions on our blueprint canvas
  const devicePositions: Record<string, { x: number; y: number }> = {
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

  return (
    <div className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-6 text-on-surface">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-on-surface flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" /> Workspace Topology Map
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Spatial monitoring of active hardware nodes across HQ Alpha Office Rooms
          </p>
        </div>

        {/* Map Control Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase rounded border transition-all ${
              showGrid
                ? 'bg-primary/20 border-primary text-primary font-bold'
                : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
            }`}
          >
            Grid Overlay
          </button>
          
          <div className="flex items-center bg-surface-container-low border border-outline-variant rounded px-1.5 py-1">
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
      <div className="relative w-full aspect-[16/9] bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden group">
        
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
            {/* Drawing Room wall outlines */}
            <rect x="5%" y="15%" width="35%" height="70%" rx="8" strokeDasharray="4 4" />
            {/* Work Room 1 wall outlines */}
            <rect x="45%" y="15%" width="50%" height="32%" rx="8" strokeDasharray="4 4" />
            {/* Work Room 2 wall outlines */}
            <rect x="45%" y="53%" width="50%" height="32%" rx="8" strokeDasharray="4 4" />
          </svg>

          {/* Room Labels */}
          <div className="absolute top-[18%] left-[8%] font-mono text-[10px] text-outline/40 uppercase font-black tracking-widest">
            Drawing Zone
          </div>
          <div className="absolute top-[18%] left-[48%] font-mono text-[10px] text-outline/40 uppercase font-black tracking-widest">
            Work Rm 1
          </div>
          <div className="absolute top-[56%] left-[48%] font-mono text-[10px] text-outline/40 uppercase font-black tracking-widest">
            Work Rm 2
          </div>

          {/* Compass Node Icon */}
          <div className="absolute bottom-4 right-4 text-outline/35 pointer-events-none flex items-center gap-1">
            <Compass className="w-5 h-5 animate-spin-slow" />
            <span className="font-mono text-[9px] uppercase tracking-wider">SEC-GRID SEC-01</span>
          </div>

          {/* Map Nodes (Interactive Devices) */}
          {devices.map((device) => {
            const pos = devicePositions[device.id];
            if (!pos) return null; // Only render nodes for specified layout positions

            const isOn = device.status === 'ON';
            const nodeColor = isOn
              ? 'bg-secondary text-on-secondary shadow-[0_0_15px_rgba(78,222,163,0.5)] border-secondary'
              : 'bg-surface-variant border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface';

            return (
              <button
                key={device.id}
                onClick={() => onToggleDevice(device.id)}
                className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-20 ${nodeColor}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
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

      {/* Map Legend */}
      <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/50 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex gap-4 flex-wrap text-xs">
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
        <p className="text-[10px] text-outline font-mono italic">
          Click any circular map node directly to trigger local mechanical relay toggling
        </p>
      </div>
    </div>
  );
}
