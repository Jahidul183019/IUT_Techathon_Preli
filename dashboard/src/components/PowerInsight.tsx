import React from 'react';
import { Bolt } from 'lucide-react';
import { Device, UsageStats } from '../types';

interface PowerInsightProps {
  devices: Device[];
  estKwhToday: number;
  usage: UsageStats | null;
}

export default function PowerInsight({ devices, estKwhToday, usage }: PowerInsightProps) {
  // Calculate dynamic wattage per room based on active devices
  const getRoomPower = (roomName: Device['room']) => {
    const usageRoom = usage?.rooms.find((room) => room.room_name === roomName);
    if (usageRoom) return usageRoom.current_watts;

    return devices
      .filter((d) => d.room === roomName && d.status === 'ON')
      .reduce((sum, d) => sum + d.currentDraw, 0);
  };

  const drawingRoomPower = getRoomPower('Drawing Room');
  const workRoom1Power = getRoomPower('Work Room 1');
  const workRoom2Power = getRoomPower('Work Room 2');

  // We set sensible reference maximum capacities to render full-scale progress bars
  const limits = {
    'Drawing Room': 500, // Watts
    'Work Room 1': 1000,
    'Work Room 2': 400,
  };

  const drawingPercent = Math.min((drawingRoomPower / limits['Drawing Room']) * 100, 100);
  const work1Percent = Math.min((workRoom1Power / limits['Work Room 1']) * 100, 100);
  const work2Percent = Math.min((workRoom2Power / limits['Work Room 2']) * 100, 100);

  return (
    <div className="space-y-3">
      {/* Power Insight Main Card */}
      <div className="bg-surface-container p-4 rounded-xl border border-outline-variant">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
            Power Insight
          </h2>
          <Bolt className="w-5 h-5 text-primary" />
        </div>

        <div className="space-y-1 mb-6">
          <p className="font-mono text-4xl font-bold text-primary">
            {estKwhToday.toFixed(1)}
          </p>
          <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">
            Est. kWh Today
          </p>
        </div>

        {/* Dynamic Progress Bars */}
        <div className="space-y-4">
          {/* Drawing Room */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">
              <span>Drawing Room</span>
              <span className={drawingRoomPower > 0 ? 'text-secondary' : 'text-outline'}>
                {drawingRoomPower}W
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(78,222,163,0.3)]"
                style={{ width: `${Math.max(drawingPercent, drawingRoomPower > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>

          {/* Work Room 1 */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">
              <span>Work Room 1</span>
              <span className={workRoom1Power > 0 ? 'text-primary' : 'text-outline'}>
                {workRoom1Power}W
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(173,199,255,0.3)]"
                style={{ width: `${Math.max(work1Percent, workRoom1Power > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>

          {/* Work Room 2 */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">
              <span>Work Room 2</span>
              <span className={workRoom2Power > 0 ? 'text-tertiary' : 'text-outline'}>
                {workRoom2Power}W
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="h-full bg-tertiary-container rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(239,103,25,0.3)]"
                style={{ width: `${Math.max(work2Percent, workRoom2Power > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Peak Demand Card with Sparkline */}
      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
            Current Load
          </p>
          <p className="font-sans text-xl font-bold text-on-surface mt-1">
            {((usage?.total_watts ?? 0) / 1000).toFixed(2)} kW
          </p>
        </div>
        {/* Dynamic bar indicators mimicking live node peaks */}
        <div className="w-20 h-10 flex items-end gap-[3px] pr-1">
          <div className="w-full bg-outline-variant/30 h-1/4 rounded-sm" />
          <div className="w-full bg-outline-variant/40 h-1/2 rounded-sm" />
          <div className="w-full bg-primary/70 h-3/4 rounded-sm animate-pulse" />
          <div className="w-full bg-primary h-full rounded-sm" />
          <div className="w-full bg-outline-variant/50 h-1/3 rounded-sm" />
          <div className="w-full bg-secondary h-2/3 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
