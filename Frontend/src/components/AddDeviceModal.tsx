import React, { useState } from 'react';
import { X, Plus, Lightbulb, Wind, Power, Cpu, ShieldAlert } from 'lucide-react';
import { Device } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: Omit<Device, 'id' | 'lastActivity' | 'currentDraw'>) => void;
}

export default function AddDeviceModal({ isOpen, onClose, onAdd }: AddDeviceModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Device['type']>('light');
  const [room, setRoom] = useState<Device['room']>('Drawing Room');
  const [status, setStatus] = useState<Device['status']>('OFF');
  const [wattage, setWattage] = useState<number>(15);

  const handleTypeChange = (newType: Device['type']) => {
    setType(newType);
    // Set standard wattages as sensible defaults
    if (newType === 'light') setWattage(15);
    else if (newType === 'fan') setWattage(60);
    else if (newType === 'ac') setWattage(1200);
    else if (newType === 'outlet') setWattage(100);
    else if (newType === 'sensor') setWattage(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      type,
      room,
      status,
      wattage,
    });
    // Reset form
    setName('');
    setType('light');
    setRoom('Drawing Room');
    setStatus('OFF');
    setWattage(15);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-surface-container border border-outline-variant rounded-xl p-card-padding shadow-2xl z-10 text-on-surface"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans font-bold text-headline-sm text-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Smart Device
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="block font-mono text-label-mono text-on-surface-variant uppercase">
                  Device Identifier / Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Desk Lamp 02, Lobby AC"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary transition-all font-sans"
                />
              </div>

              {/* Type Grid */}
              <div className="space-y-1">
                <label className="block font-mono text-label-mono text-on-surface-variant uppercase">
                  Hardware Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['light', 'fan', 'ac', 'outlet', 'sensor'] as const).map((t) => {
                    const isSelected = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
                        }`}
                      >
                        {t === 'light' && <Lightbulb className="w-5 h-5 mb-1" />}
                        {t === 'fan' && <Wind className="w-5 h-5 mb-1" />}
                        {t === 'ac' && <Wind className="rotate-90 w-5 h-5 mb-1" />}
                        {t === 'outlet' && <Power className="w-5 h-5 mb-1" />}
                        {t === 'sensor' && <Cpu className="w-5 h-5 mb-1" />}
                        <span className="text-[10px] capitalize font-sans">{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Selector */}
              <div className="space-y-1">
                <label className="block font-mono text-label-mono text-on-surface-variant uppercase">
                  Location / Zone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Drawing Room', 'Work Room 1', 'Work Room 2'] as const).map((r) => {
                    const isSelected = room === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoom(r)}
                        className={`py-2 rounded-lg border text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wattage Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-label-mono text-on-surface-variant uppercase">
                    Active Load Rating
                  </label>
                  <span className="font-mono text-xs text-primary font-bold">
                    {wattage}W
                  </span>
                </div>
                <input
                  type="range"
                  min={type === 'sensor' ? 1 : type === 'light' ? 5 : type === 'fan' ? 20 : 100}
                  max={type === 'ac' ? 3000 : type === 'fan' ? 150 : 500}
                  step={type === 'ac' ? 50 : 5}
                  value={wattage}
                  onChange={(e) => setWattage(Number(e.target.value))}
                  className="w-full accent-primary bg-surface-container-low h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-outline italic">
                  Power consumed only when the hardware is active (ON)
                </p>
              </div>

              {/* Initial State Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-outline-variant">
                <div>
                  <p className="text-body-md font-bold text-on-surface">Initial Status</p>
                  <p className="text-xs text-on-surface-variant">Device state upon creation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(status === 'ON' ? 'OFF' : 'ON')}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    status === 'ON' ? 'bg-secondary' : 'bg-outline-variant'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-surface-container transition-transform duration-200 ${
                      status === 'ON' ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 bg-surface-variant text-on-surface-variant border border-outline-variant rounded-lg font-mono text-label-mono hover:bg-surface-container-highest active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-on-primary font-bold rounded-lg font-mono text-label-mono shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  Add Device
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
