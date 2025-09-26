import React, { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';

// FIX: Used PropsWithChildren to correctly type the component that accepts children.
const PageAnimator = ({ children }: PropsWithChildren) => {
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
