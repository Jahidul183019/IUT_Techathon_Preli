import { X, HelpCircle, FileText, PhoneCall, ShieldAlert, ServerCog } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_CONTACTS = [
  { name: 'IT Support', email: 'support@office.local', phone: 'Ext. 101' },
  { name: 'Facilities', email: 'facilities@office.local', phone: 'Ext. 102' },
];

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
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
                  <div>Admin: <span className="text-on-surface">{SUPPORT_CONTACTS[0].email}</span></div>
                </div>
              </div>

              {/* Support Contacts */}
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 space-y-2">
                <p className="font-mono text-xs uppercase text-primary font-bold">Support Contacts</p>
                <div className="space-y-2">
                  {SUPPORT_CONTACTS.map((c, i) => (
                    <div key={i} className="text-xs font-mono text-on-surface-variant flex justify-between">
                      <span className="text-on-surface font-bold">{c.name}</span>
                      <span>{c.phone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold mb-3">
                  Troubleshooting FAQ
                </h4>
                
                <div className="bg-surface-variant/30 border border-outline-variant/30 rounded-lg p-3 space-y-1 hover:bg-surface-variant/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <ShieldAlert className="w-3.5 h-3.5 text-error" />
                    Why are devices flagged after 5 PM?
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    The system actively monitors for energy waste. Any lights or fans left running outside normal office hours (9 AM - 5 PM) trigger an after-hours alert.
                  </p>
                </div>

                <div className="bg-surface-variant/30 border border-outline-variant/30 rounded-lg p-3 space-y-1 hover:bg-surface-variant/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <ServerCog className="w-3.5 h-3.5 text-primary" />
                    What causes a continuous usage alert?
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    If all 5 devices in a single room (2 fans, 3 lights) are left ON continuously for more than 2 hours, a critical alert is triggered.
                  </p>
                </div>
              </div>

              {/* Support Hotline info */}
              <div className="flex gap-4 pt-2 border-t border-outline-variant/50">
                <a
                  href={`mailto:${SUPPORT_CONTACTS[0].email}`}
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
