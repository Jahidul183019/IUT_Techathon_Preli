import React, { useState } from 'react';
import { AlertTriangle, Info, BellRing, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { Alert } from '../types';

interface AlertsPanelProps {
  alerts: Alert[];
  onDismissAlert: (id: string) => void;
  onClearAllAlerts: () => void;
  onTriggerTestAlert: (level: Alert['level']) => void;
}

export default function AlertsPanel({
  alerts,
  onDismissAlert,
  onClearAllAlerts,
  onTriggerTestAlert,
}: AlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.level === filter;
  });

  return (
    <section className="bg-surface-container p-4 rounded-xl border border-outline-variant flex flex-col h-full text-on-surface">
      {/* Panel Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
            Active Alerts
          </h2>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
          </span>
        </div>
        <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded tracking-wide font-mono">
          LIVE
        </span>
      </div>

      {/* Level Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {(['all', 'critical', 'warning', 'info'] as const).map((lvl) => {
          const isSelected = filter === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded capitalize transition-all ${
                isSelected
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* Alerts Scroller */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[290px] pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-outline-variant/30 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-secondary/60 mb-2" />
            <p className="text-xs text-on-surface-variant font-mono uppercase">System is Clear</p>
            <p className="text-[10px] text-outline mt-1">No active alerts recorded</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.level === 'critical';
            const isWarning = alert.level === 'warning';

            let borderStyle = 'border-primary bg-primary-container/10';
            let iconColor = 'text-primary';
            let tagColor = 'text-primary';

            if (isCritical) {
              borderStyle = 'border-error bg-error-container/10';
              iconColor = 'text-error';
              tagColor = 'text-error';
            } else if (isWarning) {
              borderStyle = 'border-tertiary-container bg-tertiary-container/10';
              iconColor = 'text-tertiary';
              tagColor = 'text-tertiary';
            }

            return (
              <div
                key={alert.id}
                className={`p-3 border-l-4 rounded-r-lg group hover:brightness-110 transition-all ${borderStyle} relative`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 font-mono ${tagColor}`}>
                    {isCritical && <AlertTriangle className="w-3.5 h-3.5 status-pulse" />}
                    {isWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                    {!isCritical && !isWarning && <Info className="w-3.5 h-3.5" />}
                    {alert.level}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-outline">{alert.timestamp}</span>
                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-all duration-150"
                      title="Clear alert"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-on-surface pr-4">
                  {alert.message}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Simulator Actions */}
      <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between gap-2">
        <span className="text-[10px] text-outline font-mono uppercase tracking-wider">
          Simulate Alerts
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onTriggerTestAlert('critical')}
            className="px-2 py-1 bg-error-container/20 text-error hover:bg-error-container/40 text-[9px] font-mono font-bold rounded border border-error/30 transition-all"
            title="Trigger mock critical alert"
          >
            + Crit
          </button>
          <button
            onClick={() => onTriggerTestAlert('warning')}
            className="px-2 py-1 bg-tertiary-container/15 text-tertiary hover:bg-tertiary-container/30 text-[9px] font-mono font-bold rounded border border-tertiary/30 transition-all"
            title="Trigger mock warning alert"
          >
            + Warn
          </button>
          <button
            onClick={() => onTriggerTestAlert('info')}
            className="px-2 py-1 bg-primary-container/15 text-primary hover:bg-primary-container/30 text-[9px] font-mono font-bold rounded border border-primary/30 transition-all"
            title="Trigger mock diagnostic alert"
          >
            + Info
          </button>
        </div>
      </div>
    </section>
  );
}
