import React, { useState } from 'react';
import { AppBar, Toolbar, Tabs, Tab, Typography, Chip, Box, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import BalanceIcon from '@mui/icons-material/Balance';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getTabValue = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/analyze':
        return 1;
      case '/history':
        return 2;
      default:
        return 0;
    }
  };

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/analyze');
        break;
      case 2:
        navigate('/history');
        break;
      default:
        break;
    }
  };

  const navItems = [
    { label: 'Upload', path: '/', icon: <CloudUploadIcon /> },
    { label: 'Results', path: '/analyze', icon: <AssessmentIcon /> },
    { label: 'History', path: '/history', icon: <HistoryIcon /> }
  ];

  return (
    <>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      >
        <AppBar 
          position="sticky" 
          elevation={0} 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
            zIndex: 1200
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ mr: 2, display: { md: 'none' }, color: '#1A73E8' }}
              >
                <MenuIcon />
              </IconButton>
              <motion.div whileHover={{ rotate: 180, scale: 1.2 }} transition={{ duration: 0.4 }}>
                <BalanceIcon sx={{ color: '#1A73E8', mr: 1, fontSize: 32 }} />
              </motion.div>
              <Typography variant="h5" sx={{ 
                color: '#1A73E8', 
                fontWeight: 900,
                background: 'linear-gradient(45deg, #4285F4, #34A853)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}>
                EquiLens
              </Typography>
            </Box>
            
            <Tabs 
              value={getTabValue()} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{
                display: { xs: 'none', md: 'flex' },
                '& .MuiTab-root': {
                  color: '#5F6368',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minWidth: 100,
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: '#1A73E8',
                    transform: 'translateY(-2px)'
                  }
                },
                '& .Mui-selected': { color: '#1A73E8', fontWeight: 800 },
              }}
            >
              {navItems.map((item, index) => (
                <Tab key={index} label={item.label} icon={item.icon} iconPosition="start" />
              ))}
            </Tabs>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Chip
                label="GDG 2026"
                sx={{
                  backgroundColor: 'rgba(66, 133, 244, 0.1)',
                  color: '#1A73E8',
                  fontWeight: 800,
                  px: 1,
                  border: '1px solid rgba(66, 133, 244, 0.2)',
                  boxShadow: '0 2px 10px rgba(66,133,244,0.15)'
                }}
              />
            </motion.div>
          </Toolbar>
        </AppBar>
      </motion.div>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <BalanceIcon sx={{ color: '#1A73E8', mr: 1, fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: '#1A73E8', fontWeight: 900 }}>EquiLens</Typography>
        </Box>
        <List>
          {navItems.map((item) => (
            <ListItem 
              button 
              key={item.label} 
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                margin: '8px',
                borderRadius: '8px',
                backgroundColor: location.pathname === item.path ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
                color: location.pathname === item.path ? '#1A73E8' : '#5F6368',
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#1A73E8' : '#5F6368' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 800 : 500 }} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}
