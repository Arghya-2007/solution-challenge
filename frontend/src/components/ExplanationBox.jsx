import React from 'react';
import { Card, Box, Typography, ToggleButtonGroup, ToggleButton, Divider, GlobalStyles } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ConstructionIcon from '@mui/icons-material/Construction';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExplanationBox({ text, worstGroup, worstFactor, suggestedFix, language, onLanguageChange }) {

  const handleLangChange = (event, newLang) => {
    if (newLang !== null && onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  return (
      <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ position: 'relative', width: '100%', marginBottom: '2rem' }}
      >
        <GlobalStyles styles={{
          '@keyframes subtleFlow': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          }
        }} />

        {/* Animated Glowing Aura */}
        <Box sx={{
          position: 'absolute', inset: -3, borderRadius: '24px',
          background: 'linear-gradient(135deg, #4285F4, #EA4335, #FBBC05, #34A853)',
          backgroundSize: '400% 400%', animation: 'subtleFlow 10s ease infinite',
          filter: 'blur(15px)', opacity: 0.4, zIndex: 0
        }} />

        <Card sx={{
          position: 'relative', zIndex: 1, borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
          p: { xs: 3, md: 4 }, overflow: 'hidden'
        }}>

          {/* Dynamic Header Section */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8F0FE', width: 44, height: 44, borderRadius: '12px' }}
              >
                <AutoAwesomeIcon sx={{ color: '#4285F4', fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(66,133,244,0.4))' }} />
              </motion.div>
              <Typography variant="h5" fontWeight="900" sx={{ background: 'linear-gradient(45deg, #4285F4, #1A73E8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                AI Explanation
              </Typography>
            </Box>

            {/* Glassy Pill Toggle */}
            <ToggleButtonGroup
                color="primary" value={language || 'en'} exclusive onChange={handleLangChange} size="small"
                sx={{
                  background: 'rgba(0,0,0,0.03)', borderRadius: '30px', p: 0.5,
                  '& .MuiToggleButton-root': { border: 'none', borderRadius: '30px !important', px: 3, py: 0.8, textTransform: 'none', fontWeight: 700, color: 'rgba(0,0,0,0.5)', transition: 'all 0.3s' },
                  '& .Mui-selected': { background: '#fff !important', color: '#4285F4 !important', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }
                }}
            >
              <ToggleButton value="en">EN</ToggleButton>
              <ToggleButton value="hi">HI</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Text Content */}
          <Typography variant="body1" sx={{ color: 'rgba(0,0,0,0.7)', whiteSpace: 'pre-line', lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 500, mb: 4 }}>
            {text || "Synthesizing deep-learning explanation metrics..."}
          </Typography>

          {/* Highlight Metrics */}
          <AnimatePresence>
            {worstGroup && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <Box sx={{
                    bgcolor: 'rgba(251, 188, 5, 0.1)', p: 2.5, borderRadius: '12px', mb: 3,
                    borderLeft: '4px solid #FBBC05', display: 'flex', alignItems: 'flex-start', gap: 2,
                    boxShadow: 'inset 0 0 20px rgba(251, 188, 5, 0.05)'
                  }}>
                    <WarningAmberIcon sx={{ color: '#FBBC05', mt: 0.5 }} />
                    <Typography variant="body1" sx={{ color: '#202124', lineHeight: 1.6 }}>
                      <strong style={{ color: '#E37400' }}>Worst affected group:</strong> <span style={{ fontWeight: 800 }}>{worstGroup}</span> — {worstFactor} less likely to be approved.
                    </Typography>
                  </Box>
                </motion.div>
            )}

            {suggestedFix && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <Divider sx={{ my: 3, opacity: 0.5 }} />
                  <Box sx={{
                    bgcolor: 'rgba(52, 168, 83, 0.1)', p: 2.5, borderRadius: '12px',
                    borderLeft: '4px solid #34A853', display: 'flex', alignItems: 'flex-start', gap: 2,
                    boxShadow: 'inset 0 0 20px rgba(52, 168, 83, 0.05)'
                  }}>
                    <ConstructionIcon sx={{ color: '#34A853', mt: 0.5 }} />
                    <Typography variant="body1" sx={{ color: '#202124', lineHeight: 1.6 }}>
                      <strong style={{ color: '#1E8E3E' }}>Recommended Fix:</strong> {suggestedFix}
                    </Typography>
                  </Box>
                </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
  );
}