import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/utils/helpers';

export function ToastContainer() {
  const { notifications, removeNotification } = useSettingsStore();

  const icons = {
    info: <Info className="w-5 h-5 text-neon-cyan" />,
    success: <CheckCircle className="w-5 h-5 text-neon-green" />,
    warning: <AlertTriangle className="w-5 h-5 text-neon-yellow" />,
    error: <AlertCircle className="w-5 h-5 text-neon-red" />,
  };

  const backgrounds = {
    info: 'border-neon-cyan/30',
    success: 'border-neon-green/30',
    warning: 'border-neon-yellow/30',
    error: 'border-neon-red/30',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.slice(-3).map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl',
              'bg-midnight-purple/90 backdrop-blur-xl',
              'border',
              backgrounds[notification.type]
            )}
          >
            {icons[notification.type]}
            <p className="flex-1 text-sm text-white/90">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
