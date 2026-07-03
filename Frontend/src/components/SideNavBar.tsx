import React from 'react';
import { ShieldAlert, LayoutDashboard, Map, BarChart3, Radio, ShieldCheck, Plus, HelpCircle, Terminal } from 'lucide-react';
import { ActiveTab } from '../types';

interface SideNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onAddDeviceClick: () => void;
  onSupportClick: () => void;
  onLogsClick: () => void;
  activeCount: number;
  totalCount: number;
}

export default function SideNavBar({
  activeTab,
  onTabChange,
  onAddDeviceClick,
  onSupportClick,
  onLogsClick,
  activeCount,
  totalCount,
}: SideNavBarProps) {
  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map' as ActiveTab, label: 'Map View', icon: Map },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'devices' as ActiveTab, label: 'Devices', icon: Radio },
    { id: 'security' as ActiveTab, label: 'Security', icon: ShieldCheck },
  ];

  return (
    <nav className="hidden lg:flex flex-col h-[calc(100vh-4rem)] py-6 bg-surface-container-lowest border-r border-outline-variant fixed left-0 top-16 w-64 z-40 text-on-surface">
      {/* Status Card */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 p-3 bg-surface-variant rounded-xl border border-outline-variant">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-label-mono text-on-surface text-xs tracking-wider">HQ Alpha</p>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest status-pulse">
              Operational
            </p>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="flex-1 space-y-1 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-label-mono transition-all rounded-lg text-left ${
                isActive
                  ? 'bg-primary text-on-primary font-bold border-l-4 border-primary-container shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Actions and Footer */}
      <div className="px-4 mt-auto space-y-4">
        <button
          onClick={onAddDeviceClick}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-mono text-label-mono">Add Device</span>
        </button>

        <div className="pt-4 border-t border-outline-variant space-y-1">
          <button
            onClick={onSupportClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all text-left"
          >
            <HelpCircle className="w-5 h-5 text-outline" />
            <span className="font-mono text-label-mono">Support</span>
          </button>
          <button
            onClick={onLogsClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all text-left"
          >
            <Terminal className="w-5 h-5 text-outline" />
            <span className="font-mono text-label-mono">System Logs</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
