import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import googleTheme from './theme/googleTheme';
import Navbar from './components/layout/Navbar';

const LandingPage = lazy(() => import('./pages/Landing'));
const DashboardPage = lazy(() => import('./pages/Analyze'));
const HistoryPage = lazy(() => import('./pages/History'));

function App() {
  return (
    <ThemeProvider theme={googleTheme}>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
            <CircularProgress />
          </Box>
        }>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
