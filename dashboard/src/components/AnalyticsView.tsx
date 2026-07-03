import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { BarChart3, TrendingUp, Cpu, BatteryCharging, Zap } from 'lucide-react';
import { Device } from '../types';

interface AnalyticsViewProps {
  devices: Device[];
}

export default function AnalyticsView({ devices }: AnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState<'hourly' | 'daily'>('hourly');

  // Dynamic calculation for real values based on current state
  const totalOnWattage = devices
    .filter((d) => d.status === 'ON')
    .reduce((sum, d) => sum + d.wattage, 0);

  const getRoomPower = (roomName: Device['room']) => {
    return devices
      .filter((d) => d.room === roomName && d.status === 'ON')
      .reduce((sum, d) => sum + d.wattage, 0);
  };

  // Mock historical curve that offsets depending on current active load to feel "alive"
  const hourlyData = [
    { hour: '08:00', load: 150, solar: 20 },
    { hour: '10:00', load: 310, solar: 120 },
    { hour: '12:00', load: 450 + (totalOnWattage / 2), solar: 210 },
    { hour: '14:00', load: 380 + (totalOnWattage / 3), solar: 260 },
    { hour: '16:00', load: 410 + (totalOnWattage * 0.4), solar: 180 },
    { hour: '18:00', load: 280 + (totalOnWattage * 0.5), solar: 40 },
    { hour: '20:00', load: 210 + (totalOnWattage * 0.7), solar: 0 },
    { hour: '22:00', load: totalOnWattage, solar: 0 },
  ];

  const dailyData = [
    { day: 'Mon', consumption: 10.2, solar: 1.5 },
    { day: 'Tue', consumption: 11.8, solar: 2.1 },
    { day: 'Wed', consumption: 12.4, solar: 2.3 },
    { day: 'Thu', consumption: 14.1, solar: 2.5 },
    { day: 'Fri', consumption: 13.2, solar: 2.2 },
    { day: 'Sat', consumption: 6.8, solar: 0.8 },
    { day: 'Sun', consumption: 5.5, solar: 0.5 },
  ];

  // Dynamic room bars representing live loads
  const roomData = [
    { name: 'Drawing Room', current: getRoomPower('Drawing Room'), peak: 350 },
    { name: 'Work Room 1', current: getRoomPower('Work Room 1'), peak: 650 },
    { name: 'Work Room 2', current: getRoomPower('Work Room 2'), peak: 220 },
  ];

  return (
    <div className="space-y-6 text-on-surface">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-on-surface flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Energy Analytics & Metrics
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Durable carbon insights, power factor analysis, and load distribution reports
          </p>
        </div>

        {/* Timeframe switch */}
        <div className="flex gap-1.5 self-start sm:self-center bg-surface-container-low border border-outline-variant p-1 rounded-lg">
          <button
            onClick={() => setTimeframe('hourly')}
            className={`px-3 py-1 text-xs font-mono rounded ${
              timeframe === 'hourly'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Hourly Load
          </button>
          <button
            onClick={() => setTimeframe('daily')}
            className={`px-3 py-1 text-xs font-mono rounded ${
              timeframe === 'daily'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Daily Totals
          </button>
        </div>
      </div>

      {/* KPI Stats Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/15 text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
              Live Total Load
            </p>
            <p className="text-lg font-mono font-bold text-on-surface">{totalOnWattage} W</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-secondary/15 text-secondary">
            <BatteryCharging className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
              Dynamic Daily Est.
            </p>
            <p className="text-lg font-mono font-bold text-on-surface">12.4 kWh</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-tertiary-container/15 text-tertiary">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
              Total Active Nodes
            </p>
            <p className="text-lg font-mono font-bold text-on-surface">
              {devices.filter((d) => d.status === 'ON').length}/{devices.length}
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-error-container/20 text-error">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
              Grid Load Peak
            </p>
            <p className="text-lg font-mono font-bold text-on-surface">1.2 kW</p>
          </div>
        </div>
      </div>

      {/* Visual Chart Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Consumption Area Chart */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant lg:col-span-8 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-on-surface-variant">
              {timeframe === 'hourly' ? 'Load Distribution Profile (Watts)' : 'Weekly Consumption (Est. kWh)'}
            </h3>
            <p className="text-[10px] text-outline">
              Comparing active system demand with localized microgrid solar offsets
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {timeframe === 'hourly' ? (
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="loadColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4a8eff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4a8eff" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="solarColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4edea3" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4edea3" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#272a32" />
                  <XAxis dataKey="hour" stroke="#8b90a0" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#8b90a0" fontSize={10} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c2027',
                      borderColor: '#414754',
                      color: '#e0e2ed',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="load" name="System Load" stroke="#4a8eff" strokeWidth={2} fillOpacity={1} fill="url(#loadColor)" />
                  <Area type="monotone" dataKey="solar" name="Solar Array Offset" stroke="#4edea3" strokeWidth={2} fillOpacity={1} fill="url(#solarColor)" />
                </AreaChart>
              ) : (
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailyColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb695" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ffb695" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#272a32" />
                  <XAxis dataKey="day" stroke="#8b90a0" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#8b90a0" fontSize={10} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c2027',
                      borderColor: '#414754',
                      color: '#e0e2ed',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Area type="monotone" dataKey="consumption" name="System Energy (kWh)" stroke="#ffb695" strokeWidth={2} fillOpacity={1} fill="url(#dailyColor)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Performance Bar Chart */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant lg:col-span-4 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-on-surface-variant">
              Zone Distribution
            </h3>
            <p className="text-[10px] text-outline">
              Comparing live load consumption with today's peak parameters (Watts)
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#272a32" />
                <XAxis dataKey="name" stroke="#8b90a0" fontSize={9} fontFamily="monospace" />
                <YAxis stroke="#8b90a0" fontSize={9} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c2027',
                    borderColor: '#414754',
                    color: '#e0e2ed',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Bar dataKey="current" name="Live Wattage" fill="#adc7ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="peak" name="Peak Limit" fill="#ef6719" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
