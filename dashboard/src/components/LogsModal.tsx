import React, { useState, useEffect } from 'react';
import { X, Terminal, ArrowRight, Play, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLoad: number;
}

export default function LogsModal({ isOpen, onClose, activeLoad }: LogsModalProps) {
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  const bootLogs = [
    'Initializing office monitoring shell...',
    'Starting telemetry services... [OK]',
    'Connecting to shared backend snapshot stream... [CONNECTED]',
    'Syncing room inventory and usage metrics... done.',
    'Restoring dashboard session state... [SUCCESS]',
    'Monitoring active devices in rooms: [Drawing Room, Work Room 1, Work Room 2]',
  ];

  useEffect(() => {
    if (isOpen) {
      setTerminalLines(bootLogs);
    }
  }, [isOpen]);

  // Append simulated periodic diagnostic heartbeats
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const loadStr = `${activeLoad}W`;
      const heartbeats = [
        `[${timestamp}] monitor: heartbeat OK. current_cumulative_load=${loadStr}`,
        `[${timestamp}] backend: synchronized 15 devices with live store`,
        `[${timestamp}] dashboard: polling device states... no issues detected`,
      ];
      const randomLine = heartbeats[Math.floor(Math.random() * heartbeats.length)];
      setTerminalLines((prev) => [...prev, randomLine]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, activeLoad]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const cmd = inputValue.trim().toLowerCase();
    const timestamp = new Date().toLocaleTimeString();
    let response = `[${timestamp}] command not found: ${cmd}. type 'help' for options.`;

    if (cmd === 'help') {
      response = `[${timestamp}] available commands: 'clear', 'status', 'ping', 'diagnose'`;
    } else if (cmd === 'clear') {
      setTerminalLines([]);
      setInputValue('');
      return;
    } else if (cmd === 'status') {
      response = `[${timestamp}] connected_rooms=3, total_devices=15, load_index=${activeLoad}W`;
    } else if (cmd === 'ping') {
      response = `[${timestamp}] backend heartbeat acknowledged: websocket stream healthy`;
    } else if (cmd === 'diagnose') {
      response = `[${timestamp}] running dashboard self-test...\n -> Drawing Room devices: NOMINAL\n -> Work Room 1 devices: NOMINAL\n -> Work Room 2 devices: NOMINAL`;
    }

    setTerminalLines((prev) => [...prev, `office-monitor:~$ ${inputValue}`, response]);
    setInputValue('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl bg-[#0b0e16] border border-outline-variant rounded-xl p-4 shadow-2xl z-10 text-on-surface flex flex-col h-[450px]"
          >
            {/* Window bar */}
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-error" />
                  <span className="w-3 h-3 rounded-full bg-tertiary-container" />
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                </div>
                <div className="h-4 w-[1px] bg-outline-variant/50 mx-1" />
                <h3 className="font-mono text-xs text-on-surface-variant flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-secondary" /> office-monitor:~
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Lines output */}
            <div className="flex-1 overflow-y-auto font-mono text-xs p-3 bg-[#07090e] border border-outline-variant/20 rounded-lg text-secondary space-y-1.5 selection:bg-primary selection:text-on-primary">
              {terminalLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                  {line}
                </div>
              ))}
            </div>

            {/* Prompt input */}
            <form onSubmit={handleCommandSubmit} className="mt-3 flex items-center gap-2 bg-[#07090e] border border-outline-variant/20 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-primary shrink-0">office-monitor:~$</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="type 'help' or command here..."
                className="w-full bg-transparent border-none text-xs font-mono text-on-surface focus:outline-none focus:ring-0 placeholder:text-outline/30"
              />
              <button type="submit" className="text-primary hover:text-secondary p-1">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
