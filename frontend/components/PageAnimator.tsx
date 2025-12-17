import React, { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';

// Función para detectar móvil de forma segura
const isMobile = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  } catch {
    return false;
  }
};

// FIX: Used PropsWithChildren to correctly type the component that accepts children.
const PageAnimator = ({ children }: PropsWithChildren) => {
  const mobile = isMobile();
  
  // En móviles, usar animación ligera (solo fade-in, sin movimiento)
  if (mobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default PageAnimator;
