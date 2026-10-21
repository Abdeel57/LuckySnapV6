import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import { useToastContext } from '../hooks/useToast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-4 z-[200] pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ToastContainer;
