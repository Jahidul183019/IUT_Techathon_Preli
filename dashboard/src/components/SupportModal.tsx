import React from 'react';
import { X, HelpCircle, FileText, Settings, PhoneCall, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [contacts, setContacts] = React.useState<{name: string, email: string, phone: string}[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      const fetchContacts = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'https://iot-smart-home-backend-8au0.onrender.com';
          const res = await fetch(`${API_URL}/api/devices/contacts`);
          if (res.ok) {
            const data = await res.json();
            setContacts(data.contacts || []);
          }
        } catch (e) {
          console.error('Failed to fetch contacts', e);
        }
      };
      fetchContacts();
    }
  }, [isOpen]);

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
            className="relative w-full max-w-lg bg-surface-container border border-outline-variant rounded-xl p-6 shadow-2xl z-10 text-on-surface"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/50">
              <h3 className="font-sans font-bold text-lg text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> System Information & Support
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              {/* Operational details */}
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 space-y-2">
                <p className="font-mono text-xs uppercase text-primary font-bold">Node Diagnostics Information</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-on-surface-variant">
                  <div>System ID: <span className="text-on-surface">SMART-HOME-MONITOR-01</span></div>
                  <div>Deployment: <span className="text-on-surface">Local Network</span></div>
                  <div>UI Version: <span className="text-on-surface">v1.0.0</span></div>
                  <div>Admin: <span className="text-on-surface">{contacts.length > 0 ? contacts[0].email : 'admin@localhost'}</span></div>
                </div>
              </div>

              {/* Dynamic Contacts */}
              {contacts.length > 0 && (
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 space-y-2">
                  <p className="font-mono text-xs uppercase text-primary font-bold">Support Contacts</p>
                  <div className="space-y-2">
                    {contacts.map((c, i) => (
                      <div key={i} className="text-xs font-mono text-on-surface-variant flex justify-between">
                        <span className="text-on-surface font-bold">{c.name}</span>
                        <span>{c.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Troubleshooting Q&A */}
              <div className="space-y-3">
                <p className="font-mono text-xs uppercase text-on-surface-variant font-bold tracking-wider">Troubleshooting FAQ</p>

                <div className="space-y-2">
                  <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/20">
                    <p className="font-bold text-xs flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-tertiary" /> Critical alert about "AC Overload" is active?</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">This triggers when active workroom nodes exceed 1000W of combined power draw. To clear, simply toggle off high-load devices on your dashboard or floorplan.</p>
                  </div>

                  <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/20">
                    <p className="font-bold text-xs flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-primary" /> How do I map a custom IoT node?</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Click the "Add Device" button on the left workspace panel. Configure the room, type, and wattage ratings to integrate it instantly into floorplans and energy bar indices.</p>
                  </div>
                </div>
              </div>

              {/* Support Hotline info */}
              <div className="flex gap-4 pt-2 border-t border-outline-variant/50">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-surface-variant hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-primary" /> Contact Admin
                </a>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'https://iot-smart-home-backend-8au0.onrender.com'}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-on-primary hover:brightness-110 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all"
                >
                  <FileText className="w-4 h-4" /> API Reference
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
