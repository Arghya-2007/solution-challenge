import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import 'react-loading-skeleton/dist/skeleton.css';
import { SkeletonTheme } from 'react-loading-skeleton';
import googleTheme from './theme/googleTheme';
import Navbar from './components/layout/Navbar';
import Lenis from 'lenis';
import { useEffect, useMemo, memo } from 'react';
import Footer from "./components/layout/Footer.jsx";

const LandingPage = lazy(() => import('./pages/Landing'));
const DashboardPage = lazy(() => import('./pages/Analyze'));
const RecommendationPage = lazy(() => import('./pages/Recomendation'));
const HistoryPage = lazy(() => import('./pages/History'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return null;
}

const App = memo(function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      delete window.lenis;
    };
  }, []);

  const fallbackUI = useMemo(() => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
      <CircularProgress />
    </Box>
  ), []);

  // Main APP
  return (
    <ThemeProvider theme={googleTheme}>
      <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5" borderRadius="8px" duration={1.2}>
        <BrowserRouter>
          <ScrollToTop />
          <Navbar />
          <Suspense fallback={fallbackUI}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/analyze" element={<DashboardPage />} />
              <Route path="/recommendation" element={<RecommendationPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </Suspense>
          <Footer />
        </BrowserRouter>
      </SkeletonTheme>
    </ThemeProvider>
  );
});

export default App;
