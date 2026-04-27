import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

export default function PageWrapper({ children }) {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        backgroundImage: 'radial-gradient(#E8EAED 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundColor: 'white',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {children}
      </motion.div>
    </Box>
  );
}
