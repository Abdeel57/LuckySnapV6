import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import { useToastContext } from '../hooks/useToast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="fixed top-4 right-4 z-[200] pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={removeToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ToastContainer;

