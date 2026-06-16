import { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getHistory, deleteHistory } from '../api/equilens';
import SEO from '../components/SEO';
import {
  Box, Typography, GlobalStyles, IconButton,
  InputBase, Tooltip, Avatar, Chip, Button,
} from '@mui/material';
import DeleteIcon          from '@mui/icons-material/Delete';
import DeleteSweepIcon     from '@mui/icons-material/DeleteSweep';
import AssessmentIcon      from '@mui/icons-material/Assessment';
import BuildIcon           from '@mui/icons-material/Build';
import SearchIcon          from '@mui/icons-material/Search';
import CalendarTodayIcon   from '@mui/icons-material/CalendarToday';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SecurityIcon        from '@mui/icons-material/Security';

// ─── Brand tokens ────────────────────────────────────────────────────────────
const G = {
  blue:       '#4285F4',
  red:        '#EA4335',
  yellow:     '#FBBC05',
  green:      '#34A853',
  dark:       '#080C14',
  card:       '#0D1421',
  border:     'rgba(255,255,255,0.06)',
  mid:        '#6B7280',
  glass:      'rgba(255,255,255,0.035)',
  glassHover: 'rgba(255,255,255,0.065)',
};

// ─── Motion ──────────────────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1];
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

// ─── Typewriter ───────────────────────────────────────────────────────────────
const PHRASES = ['Audit Records', 'Bias Reports', 'Fairness Logs', 'Mitigation Trails', 'Analysis History'];

function useTypewriter(phrases, speed = 70, pause = 2000) {
  const [display,   setDisplay]   = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx,   setCharIdx]   = useState(0);
  const [deleting,  setDeleting]  = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let t;
    if (!deleting && charIdx <= current.length) {
      setDisplay(current.slice(0, charIdx));
      t = setTimeout(() => setCharIdx(c => c + 1), charIdx === current.length ? pause : speed);
    } else if (deleting && charIdx >= 0) {
      setDisplay(current.slice(0, charIdx));
      t = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    }
    if (!deleting && charIdx > current.length) setDeleting(true);
    if (deleting && charIdx < 0) {
      setDeleting(false);
      setPhraseIdx(p => (p + 1) % phrases.length);
      setCharIdx(0);
    }
    return () => clearTimeout(t);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return display;
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, duration = 1400 }) {
  const ref  = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return;
      done.current = true;
      let start = 0;
      const step = ts => {
        if (!start) start = ts;
        const p   = Math.min((ts - start) / duration, 1);
        const val = Math.round((1 - Math.pow(1 - p, 4)) * to);
        if (el) el.textContent = val;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.disconnect();
    }, { threshold: 0.3 });
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>0</span>;
}

// ─── Skeleton shimmer components ──────────────────────────────────────────────
const shimmerSx = {
  overflow: 'hidden', position: 'relative',
  '&::after': {
    content: '""', position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.045) 50%, transparent 100%)',
    animation: 'shimmer 1.7s ease-in-out infinite',
  },
};

function SkeletonBox({ sx = {} }) {
  return <Box sx={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', ...sx }} />;
}

function SkeletonRow() {
  return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr auto', md: '48px 1fr 84px 64px 88px' },
        gap: { xs: 2, md: 3 }, alignItems: 'center',
        p: 2.5, borderRadius: '20px',
        background: G.glass, border: `1px solid ${G.border}`,
        ...shimmerSx,
      }}>
        <SkeletonBox sx={{ width: 48, height: 48, borderRadius: '50%', display: { xs: 'none', md: 'block' } }} />
        <Box>
          <SkeletonBox sx={{ height: 17, width: '58%', mb: 1.2 }} />
          <SkeletonBox sx={{ height: 13, width: '38%', background: 'rgba(255,255,255,0.04)' }} />
        </Box>
        <SkeletonBox sx={{ height: 26, borderRadius: 100, display: { xs: 'none', md: 'block' } }} />
        <SkeletonBox sx={{ height: 14, display: { xs: 'none', md: 'block' } }} />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <SkeletonBox sx={{ width: 34, height: 34, borderRadius: '50%' }} />
          <SkeletonBox sx={{ width: 36, height: 36, borderRadius: '50%' }} />
        </Box>
      </Box>
  );
}

function SkeletonStatCard() {
  return (
      <Box sx={{
        background: G.glass, border: `1px solid ${G.border}`,
        borderRadius: '24px', p: 3, ...shimmerSx,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SkeletonBox sx={{ width: 38, height: 38, borderRadius: '12px' }} />
            <SkeletonBox sx={{ height: 13, width: 80 }} />
          </Box>
          <SkeletonBox sx={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        </Box>
        <SkeletonBox sx={{ height: 42, width: '48%', borderRadius: '10px' }} />
        <SkeletonBox sx={{ height: 11, width: '65%', mt: 1.2, background: 'rgba(255,255,255,0.03)' }} />
      </Box>
  );
}

// ─── Ring stat card ───────────────────────────────────────────────────────────
function StatCard({ title, value, icon, color, total }) {
  const pct          = total > 0 ? (value / total) * 100 : 0;
  const r            = 26;
  const circumference = 2 * Math.PI * r;
  const offset       = circumference * (1 - pct / 100);

  return (
      <motion.div variants={fadeUp}>
        <motion.div whileHover={{ scale: 1.025, y: -4 }} transition={{ type: 'spring', stiffness: 340, damping: 22 }}>
          <Box sx={{
            background: G.glass, backdropFilter: 'blur(24px)',
            border: `1px solid ${G.border}`, borderRadius: '24px', p: 3,
            position: 'relative', overflow: 'hidden',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            '&:hover': { borderColor: `${color}35`, boxShadow: `0 16px 48px ${color}22` },
          }}>
            {/* corner glow */}
            <Box sx={{ position: 'absolute', top: -32, right: -32, width: 110, height: 110, background: `radial-gradient(circle, ${color}28, transparent 70%)`, pointerEvents: 'none' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1.2, borderRadius: '14px', background: `${color}18`, color }}>
                  {icon}
                </Box>
                <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {title}
                </Typography>
              </Box>
              {/* Animated SVG ring */}
              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                <circle
                    cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)' }}
                />
              </svg>
            </Box>

            <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: '2.6rem', color: '#fff', lineHeight: 1 }}>
              <Counter to={value} />
            </Typography>
            <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: '0.76rem', color: `${color}80`, mt: 0.6 }}>
              {Math.round(pct)}% of all records
            </Typography>
          </Box>
        </motion.div>
      </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function History() {
  const typed = useTypewriter(PHRASES);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const navigate = useNavigate();

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteHistory(id);
      setHistoryItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleDeleteAll = async () => {
    if (!historyItems.length) return;
    if (!window.confirm("Are you sure you want to delete all history records? This action cannot be undone.")) return;
    try {
      const ids = historyItems.map(i => i.id);
      await Promise.all(ids.map(id => deleteHistory(id)));
      setHistoryItems([]);
    } catch (err) { console.error('Delete all failed:', err); }
  };

  useEffect(() => {
    getHistory()
        .then(data => { setHistoryItems(data); setLoading(false); })
        .catch(err  => { console.error(err);   setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return historyItems;
    const q = search.toLowerCase();
    return historyItems.filter(h =>
        (h.datasetName || '').toLowerCase().includes(q) ||
        (h.type        || '').toLowerCase().includes(q)
    );
  }, [search, historyItems]);

  const auditCount = historyItems.filter(h => h.type === 'audit').length;
  const mitCount   = historyItems.filter(h => h.type === 'mitigation').length;
  const total      = historyItems.length;

  return (
      <Box sx={{
        minHeight: '100vh',
        background: G.dark,
        pt: { xs: 11, md: 14 },
        pb: { xs: 8,  md: 12 },
        px: { xs: 2, sm: 3, md: 6 },
        position: 'relative', overflow: 'hidden',
      }}>
        <SEO title="EquiLens - Analysis History" />

        {/* ── Global keyframes ─────────────────────────────────────────────── */}
        <GlobalStyles styles={{
          '@keyframes shimmer': {
            '0%':   { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(200%)' },
          },
          '@keyframes cursorBlink': {
            '0%,100%': { opacity: 1 },
            '50%':     { opacity: 0 },
          },
          '@keyframes gridMove': {
            '0%':   { backgroundPosition: '0 0' },
            '100%': { backgroundPosition: '48px 48px' },
          },
          '@keyframes orb1': {
            '0%,100%': { transform: 'translate(0,0) scale(1)' },
            '40%':     { transform: 'translate(40px,-55px) scale(1.12)' },
            '70%':     { transform: 'translate(-25px,25px) scale(0.94)' },
          },
          '@keyframes orb2': {
            '0%,100%': { transform: 'translate(0,0) scale(1)' },
            '35%':     { transform: 'translate(-50px,40px) scale(1.08)' },
            '65%':     { transform: 'translate(30px,-30px) scale(0.96)' },
          },
          /* thin, dark scrollbars */
          '::-webkit-scrollbar': { width: '5px' },
          '::-webkit-scrollbar-track': { background: G.dark },
          '::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' },
        }} />

        {/* ── Animated dot-grid overlay ──────────────────────────────────── */}
        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          animation: 'gridMove 12s linear infinite',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%)',
        }} />

        {/* ── Ambient orbs ──────────────────────────────────────────────── */}
        {[
          { color: G.blue,   top: '8%',   left: '-8%',  size: '48vw', anim: 'orb1 20s ease-in-out infinite' },
          { color: G.green,  bottom:'4%', right:'-8%',  size: '52vw', anim: 'orb2 25s ease-in-out infinite' },
          { color: G.yellow, top: '45%',  left: '35%',  size: '32vw', anim: 'orb1 30s ease-in-out infinite reverse' },
        ].map((orb, i) => (
            <Box key={i} sx={{
              position: 'fixed', pointerEvents: 'none', zIndex: 0,
              top: orb.top, left: orb.left, bottom: orb.bottom, right: orb.right,
              width: orb.size, height: orb.size,
              background: `radial-gradient(circle, ${orb.color}18, transparent 70%)`,
              filter: 'blur(90px)', animation: orb.anim,
            }} />
        ))}

        {/* ── Page content ─────────────────────────────────────────────── */}
        <Box sx={{ maxWidth: 1400, mx: 'auto', position: 'relative', zIndex: 10 }}>

          {/* ── HEADER ───────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
            <Box sx={{ mb: { xs: 6, md: 9 }, textAlign: { xs: 'left', md: 'center' } }}>

              {/* Badge */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1,
                  px: 2, py: 0.85, borderRadius: 100, mb: 3,
                  background: 'rgba(66,133,244,0.1)',
                  border: '1px solid rgba(66,133,244,0.22)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <SecurityIcon sx={{ fontSize: 14, color: G.blue }} />
                  <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: G.blue }}>
                    EquiLens Activity
                  </Typography>
                </Box>
              </motion.div>

              {/* Heading */}
              <Typography sx={{
                fontFamily: "'Syne',sans-serif", fontWeight: 900,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
                lineHeight: 1.04, letterSpacing: '-0.04em', color: '#fff', mb: 2.5,
                wordBreak: 'break-word',
              }}>
                Your{' '}
                <Box component="span" sx={{
                  background: `linear-gradient(135deg, ${G.blue} 0%, ${G.green} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {typed}
                  <Box component="span" sx={{
                    display: 'inline-block', width: '3px', height: '0.82em',
                    background: G.blue, ml: '4px', verticalAlign: 'middle',
                    animation: 'cursorBlink 0.9s step-end infinite',
                  }} />
                </Box>
              </Typography>

              <Typography sx={{
                fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 500,
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                color: 'rgba(255,255,255,0.38)',
                maxWidth: 580, mx: { md: 'auto' }, lineHeight: 1.75,
              }}>
                A command center for all your dataset audits and bias mitigation operations.
                Search, review, and track fairness over time.
              </Typography>
            </Box>
          </motion.div>

          {/* ── BENTO GRID ───────────────────────────────────────────── */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '290px 1fr' },
              gap: { xs: 3, md: 4 },
            }}>

              {/* ── SIDEBAR ─────────────────────────────────────────── */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Search */}
                <motion.div variants={fadeUp}>
                  <Box sx={{
                    background: G.glass, backdropFilter: 'blur(24px)',
                    border: `1px solid ${G.border}`, borderRadius: '24px', p: 2.5,
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                    '&:focus-within': {
                      borderColor: `${G.blue}55`,
                      boxShadow: `0 0 0 4px ${G.blue}14, 0 8px 32px ${G.blue}10`,
                    },
                  }}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      px: 2, py: 1.5,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '14px',
                    }}>
                      <SearchIcon sx={{ color: 'rgba(255,255,255,0.28)', fontSize: 20, flexShrink: 0 }} />
                      <InputBase
                          placeholder="Search records…"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          sx={{
                            flex: 1,
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            fontSize: '0.9rem', fontWeight: 600, color: '#fff',
                            '& input::placeholder': { color: 'rgba(255,255,255,0.26)', opacity: 1 },
                          }}
                      />
                      <AnimatePresence>
                        {search && (
                            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}>
                              <IconButton onClick={() => setSearch('')} size="small" sx={{ color: 'rgba(255,255,255,0.3)', p: 0.4, '&:hover': { color: '#fff' } }}>
                                <Box component="span" sx={{ fontFamily: 'sans-serif', fontSize: 18, lineHeight: 1, display: 'block' }}>×</Box>
                              </IconButton>
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>
                </motion.div>

                {/* Stat cards or skeletons */}
                {loading ? (
                    <><SkeletonStatCard /><SkeletonStatCard /></>
                ) : (
                    <>
                      <StatCard title="Total Audits"  value={auditCount} icon={<AssessmentIcon sx={{ fontSize: 18 }} />} color={G.blue}  total={total} />
                      <StatCard title="Mitigations"   value={mitCount}   icon={<BuildIcon      sx={{ fontSize: 18 }} />} color={G.green} total={total} />
                    </>
                )}

                {/* Breakdown bar */}
                {!loading && total > 0 && (
                    <motion.div variants={fadeUp}>
                      <Box sx={{
                        background: G.glass, border: `1px solid ${G.border}`,
                        borderRadius: '20px', p: 2.5,
                      }}>
                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', mb: 2 }}>
                          Breakdown
                        </Typography>
                        <Box sx={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex' }}>
                          <Box sx={{ width: `${(auditCount / total) * 100}%`, background: G.blue,  transition: 'width 1.5s cubic-bezier(0.22,1,0.36,1)' }} />
                          <Box sx={{ width: `${(mitCount   / total) * 100}%`, background: G.green, transition: 'width 1.5s cubic-bezier(0.22,1,0.36,1) 0.1s' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.8 }}>
                          {[{ label: 'Audits', color: G.blue }, { label: 'Mitigations', color: G.green }].map(d => (
                              <Box key={d.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: d.color }} />
                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.38)' }}>
                                  {d.label}
                                </Typography>
                              </Box>
                          ))}
                        </Box>
                      </Box>
                    </motion.div>
                )}
              </Box>

              {/* ── MAIN PANEL ──────────────────────────────────────── */}
              <motion.div variants={fadeUp} style={{ minWidth: 0 }}>
                <Box sx={{
                  background: 'rgba(10,16,28,0.88)', backdropFilter: 'blur(44px)',
                  border: `1px solid ${G.border}`, borderRadius: '28px',
                  p: { xs: 2.5, sm: 3, md: 4 },
                  minHeight: 600, display: 'flex', flexDirection: 'column',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* top accent line */}
                  <Box sx={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: '1px', background: `linear-gradient(90deg, transparent, ${G.blue}70, ${G.green}70, transparent)` }} />

                  {/* Panel header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 3, md: 4 } }}>
                    <Box>
                      <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.65rem' }, color: '#fff', lineHeight: 1 }}>
                        Recent Activity
                      </Typography>
                      <AnimatePresence>
                        {!loading && (
                            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                              <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', mt: 0.6 }}>
                                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                                {search && ` matching "${search}"`}
                              </Typography>
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                    {/* Actions and macOS-style traffic lights */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.4 }}>
                      {historyItems.length > 0 && (
                          <Button
                              onClick={handleDeleteAll}
                              startIcon={<DeleteSweepIcon />}
                              size="small"
                              sx={{
                                color: G.red,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                textTransform: 'none',
                                background: `${G.red}14`,
                                borderRadius: '8px',
                                px: 1.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  background: `${G.red}25`,
                                  transform: 'translateY(-1px)',
                                }
                              }}
                          >
                            Delete All
                          </Button>
                      )}
                      <Box sx={{ display: 'flex', gap: 0.85 }}>
                        {[G.red, G.yellow, G.green].map((c, i) => (
                            <Box key={i} sx={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.65 }} />
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  {/* ── CONTENT ──────────────────────────────────────── */}
                  {loading ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                      </Box>

                  ) : filtered.length === 0 ? (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                          <CalendarTodayIcon sx={{ fontSize: 34, color: 'rgba(255,255,255,0.18)' }} />
                        </Box>
                        <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: 'rgba(255,255,255,0.28)', mb: 1 }}>
                          {search ? 'No matches found' : 'No records yet'}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 500, fontSize: '0.85rem', color: 'rgba(255,255,255,0.18)' }}>
                          {search ? 'Try a different term.' : 'Run an audit or mitigation to see history here.'}
                        </Typography>
                      </Box>

                  ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
                        <AnimatePresence mode="popLayout">
                          {filtered.map((item, idx) => {
                            const isAudit = item.type === 'audit';
                            const color   = isAudit ? G.blue : G.green;
                            const dateStr = item.date
                                ? new Date(item.date).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })
                                : 'Unknown Date';

                            return (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: idx * 0.04, ease } }}
                                    exit={{ opacity: 0, scale: 0.93, transition: { duration: 0.2 } }}
                                >
                                  <motion.div whileHover={{ scale: 1.006 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
                                    <Box
                                        onClick={() => navigate(`/history/${item.id}`)}
                                        sx={{
                                          display: 'grid',
                                          gridTemplateColumns: { xs: '1fr auto', md: '48px 1fr auto auto auto' },
                                          gap: { xs: 2, md: 3 },
                                          alignItems: 'center',
                                          p: { xs: 2, md: 2.5 },
                                          borderRadius: '20px',
                                          background: G.glass,
                                          border: `1px solid ${G.border}`,
                                          cursor: 'pointer',
                                          position: 'relative', overflow: 'hidden',
                                          transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
                                          /* accent stripe */
                                          '&::before': {
                                            content: '""', position: 'absolute',
                                            left: 0, top: '20%', bottom: '20%',
                                            width: '3px', borderRadius: '0 4px 4px 0',
                                            background: color, opacity: 0.65,
                                            transition: 'top 0.28s, bottom 0.28s, opacity 0.28s',
                                          },
                                          '&:hover': {
                                            background: G.glassHover,
                                            borderColor: `${color}40`,
                                            boxShadow: `0 8px 36px ${color}1A`,
                                            '&::before': { top: '8%', bottom: '8%', opacity: 1 },
                                          },
                                        }}
                                    >
                                      <Avatar sx={{ background: `${color}18`, color, width: 48, height: 48, display: { xs: 'none', md: 'flex' }, border: `1px solid ${color}28`, flexShrink: 0 }}>
                                        {isAudit ? <AssessmentIcon sx={{ fontSize: 20 }} /> : <BuildIcon sx={{ fontSize: 20 }} />}
                                      </Avatar>

                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: { xs: '0.92rem', md: '1rem' }, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {item.datasetName || 'Unnamed Dataset'}
                                        </Typography>
                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: '0.76rem', color: 'rgba(255,255,255,0.32)', mt: 0.4 }}>
                                          {dateStr}
                                        </Typography>
                                      </Box>

                                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                        <Chip
                                            label={item.type}
                                            size="small"
                                            sx={{ background: `${color}14`, color, fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize', letterSpacing: '0.06em', border: `1px solid ${color}28` }}
                                        />
                                      </Box>

                                      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.7 }}>
                                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: item.status === 'FAIL' ? G.red : G.green, boxShadow: `0 0 8px ${item.status === 'FAIL' ? G.red : G.green}88` }} />
                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '0.76rem', color: item.status === 'FAIL' ? G.red : G.green }}>
                                          {item.status || 'DONE'}
                                        </Typography>
                                      </Box>

                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                        <Tooltip title="Delete record" placement="top">
                                          <IconButton
                                              onClick={e => handleDelete(e, item.id)}
                                              size="small"
                                              sx={{ color: 'rgba(255,255,255,0.22)', transition: 'all 0.2s', '&:hover': { color: G.red, background: `${G.red}14` } }}
                                          >
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Box sx={{
                                          width: 36, height: 36, borderRadius: '50%',
                                          background: 'rgba(255,255,255,0.05)',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          transition: 'background 0.22s, transform 0.22s',
                                          '&:hover': { background: color, transform: 'translateX(3px)' },
                                        }}>
                                          <ArrowForwardIosIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }} />
                                        </Box>
                                      </Box>
                                    </Box>
                                  </motion.div>
                                </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </Box>
                  )}
                </Box>
              </motion.div>
            </Box>
          </motion.div>
        </Box>
      </Box>
  );
}