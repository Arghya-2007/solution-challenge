import { useState } from 'react';
import { AppBar, Toolbar, Tabs, Tab, Typography, Chip, Box, IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import BalanceIcon from '@mui/icons-material/Balance';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
        style={{ position: 'sticky', top: 0, zIndex: 1200 }}
      >
        <AppBar 
          position="static" 
          elevation={0} 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '2px solid transparent',
            borderImage: 'linear-gradient(to right, #4285F4, #EA4335, #FBBC04, #34A853) 1',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                <BalanceIcon sx={{ color: '#4285F4', mr: 1, fontSize: 32 }} />
              </motion.div>
              <motion.div
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(45deg, #4285F4, #EA4335, #FBBC04, #34A853, #4285F4)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <Typography variant="h5" sx={{
                  fontWeight: 900,
                  display: { xs: 'none', sm: 'block' }
                }}>
                  EquiLens
                </Typography>
              </motion.div>
            </Box>
            
            <Tabs 
              value={getTabValue()} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{
                display: { xs: 'none', md: 'flex' },
                '& .MuiTabs-indicator': {
                  background: 'linear-gradient(to right, #4285F4, #EA4335, #FBBC04, #34A853)',
                  height: '3px',
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  color: '#5F6368',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minWidth: 100,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#4285F4',
                    transform: 'translateY(-2px)'
                  }
                },
                '& .Mui-selected': {
                  color: '#EA4335 !important',
                  fontWeight: 800
                },
              }}
            >
              {navItems.map((item, index) => (
                <Tab key={index} label={item.label} icon={item.icon} iconPosition="start" />
              ))}
            </Tabs>

            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.95 }}
              animate={{ boxShadow: ['0 0 0px #4285F4', '0 0 15px #4285F4', '0 0 0px #4285F4'] }}
              transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
              style={{ borderRadius: '16px' }}
            >
              <Chip
                label="GDG 2026"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  color: '#4285F4',
                  fontWeight: 800,
                  px: 1,
                  border: '2px solid transparent',
                  backgroundClip: 'padding-box',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0, left: 0,
                    zIndex: -1,
                    margin: '-2px',
                    borderRadius: 'inherit',
                    background: 'linear-gradient(45deg, #4285F4, #EA4335, #FBBC04, #34A853)',
                  }
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
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280, 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
          },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <BalanceIcon sx={{ color: '#FBBC04', mr: 1, fontSize: 32 }} />
          <Typography variant="h6" sx={{ 
            fontWeight: 900,
            background: 'linear-gradient(45deg, #4285F4, #34A853)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            EquiLens
          </Typography>
        </Box>
        <List sx={{ px: 2, pt: 2 }}>
          {navItems.map((item) => (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={item.label}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  mb: 1,
                  borderRadius: '12px',
                  backgroundColor: location.pathname === item.path ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
                  color: location.pathname === item.path ? '#4285F4' : '#5F6368',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(66, 133, 244, 0.05)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? '#EA4335' : '#5F6368', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={<Typography sx={{ fontWeight: location.pathname === item.path ? 800 : 500 }}>{item.label}</Typography>}
                />
              </ListItemButton>
            </motion.div>
          ))}
        </List>
      </Drawer>
    </>
  );
}
