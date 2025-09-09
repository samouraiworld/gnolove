'use client';

import React from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { useOffline } from '@/contexts/offline-context';

const OfflineBanner: React.FC = () => {
  const { isOffline } = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          initial={{ y: '100%' }}
          transition={{ ease: 'easeOut' }}
          className="bg-red-9 text-white-a-12 fixed bottom-0 left-0 z-50 w-full text-center"
        >
          You are offline. Some features may not be available.
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
