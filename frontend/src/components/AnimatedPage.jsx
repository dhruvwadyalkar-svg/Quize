import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedPage = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-[calc(100vh-73px)] overflow-hidden ${className}`}>
      {/* Animated Glowing Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[-10%] left-[20%] w-[35rem] h-[35rem] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none z-0"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-[-10%] right-[15%] w-[40rem] h-[40rem] bg-purple-600/25 rounded-full blur-[130px] pointer-events-none z-0"
      />

      {/* Main Page Motion Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};
