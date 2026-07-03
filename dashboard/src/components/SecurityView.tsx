import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Video, Lock, Unlock, Radio, Eye, Trash2 } from 'lucide-react';

interface LogEntry {
  id: string;
  time: string;
  event: string;
  level: 'safe' | 'caution' | 'breach';
}

export default function SecurityView() {
  const [isArmed, setIsArmed] = useState<boolean>(true);
  const [firewallStatus, setFirewallStatus] = useState<'nominal' | 'scanning'>('nominal');
  const [cctvQuality, setCctvQuality] = useState<'1080p' | '720p'>('1080p');
  const [activeCam, setActiveCam] = useState<number>(1);
  const [timeStr, setTimeStr] = useState<string>('');

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: '09:14:10', event: 'Keycard access granted: User "Shadman" (HQ Corridor)', level: 'safe' },
    { id: '2', time: '09:05:42', event: 'Firewall: Blocked malicious port scan on Node 08', level: 'caution' },
    { id: '3', time: '08:42:19', event: 'Sensor: Front Entrance door magnetic seal ENGAGED', level: 'safe' },
    { id: '4', time: '07:30:12', event: 'System: Dynamic security parameters fully armed', level: 'safe' },
  ]);

  // Clock updating for CCTV Feed
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleArmToggle = () => {
    setIsArmed(!isArmed);
    const now = new Date().toLocaleTimeString();
    setLogs((prev) => [
      {
        id: String(prev.length + 1),
        time: now,
        event: isArmed ? 'ALARM STATE DEACTIVATED (Bypass active)' : 'ALARM ARMED (Secure Lockout enabled)',
        level: isArmed ? 'caution' : 'safe',
      },
      ...prev,
    ]);
  };

  const handleFirewallScan = () => {
    setFirewallStatus('scanning');
    setTimeout(() => {
      setFirewallStatus('nominal');
      const now = new Date().toLocaleTimeString();
      setLogs((prev) => [
        {
          id: String(prev.length + 1),
          time: now,
          event: 'Firewall: Completed full threat database audit (100% Secure)',
          level: 'safe',
        },
        ...prev,
      ],);
    }, 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-6 text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-on-surface flex items-center gap-2">
            {isArmed ? (
              <ShieldCheck className="w-5 h-5 text-secondary" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-error status-pulse" />
            )}
            Security Operations Center (SOC)
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Intrusion detection, physical locks, firewalls, and active CCTV perimeter feeds
            <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
              Demo/Illustrative Only (Not wired to backend)
            </span>
          </p>
        </div>

        {/* Primary Security Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleArmToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer ${
              isArmed
                ? 'bg-secondary/15 border border-secondary text-secondary hover:bg-secondary/25'
                : 'bg-error/15 border border-error text-error hover:bg-error/25 status-pulse'
            }`}
          >
            {isArmed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {isArmed ? 'System Armed' : 'Bypass Alert'}
          </button>

          <button
            onClick={handleFirewallScan}
            disabled={firewallStatus === 'scanning'}
            className="px-3 py-2 bg-surface-variant border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {firewallStatus === 'scanning' ? 'Auditing...' : 'Firewall Scan'}
          </button>
        </div>
      </div>

      {/* Grid containing CCTV Stream and Sensor Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CCTV Camera Stream Placeholder (Simulated Canvas) */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between h-[360px] relative overflow-hidden">
          
          {/* Stream Overlay Details */}
          <div className="flex justify-between items-start z-10 font-mono text-[11px] text-secondary tracking-wider">
            <span className="flex items-center gap-1 bg-surface-container-lowest/80 px-2 py-1 rounded border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
              LIVE FEED: CAM 0{activeCam}
            </span>
            <span className="bg-surface-container-lowest/80 px-2 py-1 rounded border border-outline-variant/30">
              {timeStr} | {cctvQuality}
            </span>
          </div>

          {/* Simple Vector CCTV Camera View Graphics */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.06]">
            <Video className="w-32 h-32 text-on-surface" />
            <p className="font-mono text-sm uppercase tracking-[0.3em] font-black mt-2">STREAM SECURITY_0{activeCam}</p>
          </div>

          {/* CCTV Static Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />

          {/* Toggle Cam Buttons */}
          <div className="mt-auto flex justify-between items-center z-10 pt-4">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((camNum) => (
                <button
                  key={camNum}
                  onClick={() => setActiveCam(camNum)}
                  className={`px-3 py-1 font-mono text-[10px] rounded transition-all ${
                    activeCam === camNum
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-variant text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Cam 0{camNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCctvQuality(cctvQuality === '1080p' ? '720p' : '1080p')}
              className="text-[10px] font-mono uppercase bg-surface-container-low px-2 py-1 rounded border border-outline-variant/30 text-outline hover:text-on-surface"
            >
              HD: {cctvQuality}
            </button>
          </div>
        </div>

        {/* Security Log Feed and Sensor list */}
        <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between h-[360px]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                Threat & Access Logs
              </h3>
              <button
                onClick={handleClearLogs}
                className="text-[10px] text-outline hover:text-error transition-colors flex items-center gap-1 font-mono uppercase"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            {/* Scrollable list of entries */}
            <div className="space-y-2.5 overflow-y-auto max-h-[175px] pr-1">
              {logs.length === 0 ? (
                <p className="text-center text-[11px] text-outline font-mono uppercase py-8">
                  Security queue empty
                </p>
              ) : (
                logs.map((log) => {
                  let alertDot = 'bg-secondary';
                  if (log.level === 'caution') alertDot = 'bg-tertiary-container';
                  if (log.level === 'breach') alertDot = 'bg-error';

                  return (
                    <div
                      key={log.id}
                      className="text-[11px] font-mono leading-relaxed border-b border-outline-variant/20 pb-2 flex gap-2 items-start"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alertDot}`} />
                      <div className="space-y-0.5">
                        <span className="text-outline text-[10px] font-bold mr-2">{log.time}</span>
                        <span className="text-on-surface-variant">{log.event}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Door/Window status indicators */}
          <div className="pt-4 border-t border-outline-variant/40 grid grid-cols-2 gap-3 text-xs font-mono text-on-surface-variant">
            <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20 flex items-center justify-between">
              <span className="uppercase text-[9px] font-bold">Lobby Doors</span>
              <span className="text-secondary font-bold uppercase text-[9px]">LOCKED</span>
            </div>
            <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20 flex items-center justify-between">
              <span className="uppercase text-[9px] font-bold">Server Safe</span>
              <span className="text-secondary font-bold uppercase text-[9px]">SECURE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
