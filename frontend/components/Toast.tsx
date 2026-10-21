import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ICONS = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info };

const ICON_COLORS: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-sky-400',
};

const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const Icon = ICONS[type];

  return (
    <motion.div
      role={type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="w-full sm:w-96 rounded-2xl border border-white/10 bg-background-secondary shadow-2xl shadow-black/40 p-4 mb-3"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${ICON_COLORS[type]}`} aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white">{title}</p>
          {message && <p className="text-sm text-slate-400 mt-0.5">{message}</p>}
        </div>
        <button
          type="button"
          onClick={() => onClose(id)}
          className="-m-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default Toast;
