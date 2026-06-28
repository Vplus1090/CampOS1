import React from 'react';
import { motion } from 'framer-motion';

export default function PremiumLoadingScreen() {
  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden select-none z-[99999]"
      style={{
        backgroundColor: 'var(--m3-surface, #121214)',
      }}
    >
      <div className="flex flex-col items-center gap-5 relative z-10">
        {/* Typographic Header (Matching Lockscreen style) */}
        <motion.div
          initial={{ opacity: 0.7, scale: 0.98 }}
          animate={{ 
            opacity: [0.7, 1, 0.7], 
            scale: [0.99, 1.01, 0.99] 
          }}
          transition={{ 
            duration: 2.0, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="flex flex-col items-center"
        >
          <span className="text-[10px] font-bold tracking-[0.25em] text-m3-onSurfaceVariant uppercase font-mono mb-1.5 opacity-60">
            Starting
          </span>
          <h1 className="text-[42px] font-semibold text-m3-onSurface tracking-tight font-sans leading-none">
            CampOS
          </h1>
        </motion.div>

        {/* Minimal Progress Bar */}
        <div className="w-20 h-[2px] bg-m3-surfaceContainerHighest rounded-full overflow-hidden relative mt-1.5 opacity-80">
          <div
            className="h-full rounded-full animate-loading-runner absolute inset-y-0 left-0"
            style={{
              background: 'linear-gradient(90deg, var(--m3-primary) 0%, var(--m3-tertiary) 100%)',
              width: '40%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
