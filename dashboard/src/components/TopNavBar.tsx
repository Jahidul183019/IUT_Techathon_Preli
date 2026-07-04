import React from 'react';
import { Bell, Settings, User, Signal } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface TopNavBarProps {
  activeLoad: number;
  activeNodes: number;
  totalNodes: number;
  wsStatus: ConnectionStatus;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  onProfileClick: () => void;
  alertCount: number;
}

export default function TopNavBar({
  activeLoad,
  activeNodes,
  totalNodes,
  wsStatus,
  onNotificationsClick,
  onSettingsClick,
  onProfileClick,
  alertCount,
}: TopNavBarProps) {
  const isConnected = wsStatus === 'connected';

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3 bg-background/80 backdrop-blur-md border-b border-outline-variant text-on-surface">
      {/* Brand logo and connection indicator */}
      <div className="flex items-center gap-4">
        <span className="font-sans text-xl font-black tracking-tighter text-primary">
          Smart Office IoT
        </span>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-container-low border border-outline-variant rounded-full">
          <Signal className={`w-3.5 h-3.5 ${isConnected ? 'text-secondary' : 'text-tertiary'}`} />
          <span
            className={`w-2 h-2 rounded-full status-pulse ${
              isConnected
                ? 'bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.5)]'
                : 'bg-tertiary-container shadow-[0_0_8px_rgba(239,103,25,0.5)]'
            }`}
          />
          <span
            className={`font-mono text-[10px] uppercase tracking-wider ${
              isConnected ? 'text-secondary' : 'text-tertiary'
            }`}
          >
            {wsStatus}
          </span>
        </div>
      </div>

      {/* Dynamic Telemetry Metrics and Action Buttons */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Active Load telemetry */}
        <div className="flex flex-col items-end">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            Active Load
          </span>
          <span className="font-mono text-xl font-bold text-primary">
            {activeLoad}W
          </span>
        </div>

        {/* Node alignment bar separator */}
        <div className="h-8 w-[1px] bg-outline-variant" />

        {/* Nodes telemetry */}
        <div className="flex flex-col items-end">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            Nodes
          </span>
          <span className="font-mono text-xl font-bold text-on-surface">
            {activeNodes}/{totalNodes}
          </span>
        </div>

        {/* Action icons toolbar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications Button */}
          <button
            onClick={onNotificationsClick}
            className="relative p-2 rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 duration-100"
            title="Active Alerts Feed"
          >
            <Bell className="w-5 h-5 text-on-surface-variant hover:text-on-surface transition-colors" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error animate-ping" />
            )}
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 duration-100"
            title="System Configuration"
          >
            <Settings className="w-5 h-5 text-on-surface-variant hover:text-on-surface transition-colors" />
          </button>

          {/* Profile Button */}
          <button
            onClick={onProfileClick}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 duration-100"
            title="User Profile"
          >
            <User className="w-5 h-5 text-primary hover:brightness-110 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}
