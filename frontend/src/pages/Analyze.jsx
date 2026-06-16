import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, MenuItem, Button,
    GlobalStyles, Tabs, Tab, Chip, Divider, Tooltip as MuiTooltip
} from '@mui/material';
import {
    PictureAsPdf as PictureAsPdfIcon,
    Language as LanguageIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircleOutlined as CheckCircleOutlineIcon,
    ErrorOutlined as ErrorOutlineIcon,
    WarningAmber as WarningAmberIcon,
    InfoOutlined as InfoIcon,
    DataArray as DataArrayIcon,
    Analytics as AnalyticsIcon,
    Shield as ShieldIcon,
    AutoAwesome as AutoAwesomeIcon,
    Memory as MemoryIcon,
    Speed as SpeedIcon,
    BubbleChart as BubbleChartIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { analyzeDataset, exportReport } from '../api/equilens';
import MetricCard from '../components/MetricCard';
import BiasChart from '../components/BiasChart';
import ExplanationBox from '../components/ExplanationBox';
import ErrorPage from './ErrorPage';
import SEO from '../components/SEO';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';

// ─── Brand palette ─────────────────────────────────────────────────────────────
const G = {
    blue:   '#4285F4',
    red:    '#EA4335',
    yellow: '#FBBC05',
    green:  '#34A853',
    dark:   '#202124',
    mid:    '#5F6368',
    light:  '#F8F9FA',
    border: 'rgba(0,0,0,0.08)',
    glass:  'rgba(255,255,255,0.7)',
    glassDark: 'rgba(32,33,36,0.85)',
};

// ─── Device capability ─────────────────────────────────────────────────────────
const PERF_MODE = typeof window !== 'undefined'
    ? (window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4)
    : false;

// ─── Severity config ────────────────────────────────────────────────────────────
const SEV = {
    critical: { color: G.red,    icon: ErrorOutlineIcon,        label: 'Critical Risk', bg: `${G.red}0f`    },
    high:     { color: '#f57c00', icon: WarningAmberIcon,       label: 'High Risk',     bg: `#f57c000f`     },
    moderate: { color: G.yellow, icon: WarningAmberIcon,        label: 'Moderate',      bg: `${G.yellow}0f` },
    low:      { color: G.green,  icon: CheckCircleOutlineIcon,  label: 'Low Risk',      bg: `${G.green}0f`  },
    safe:     { color: G.green,  icon: CheckCircleOutlineIcon,  label: 'Safe',          bg: `${G.green}0f`  },
};

// ─── Processing Steps ───────────────────────────────────────────────────────────
const PROCESSING_STEPS = [
    { key: 'pending',              icon: MemoryIcon,       label: 'Initializing Workspace',           sub: 'Allocating compute resources' },
    { key: 'downloadingDataset',   icon: DataArrayIcon,    label: 'Downloading Dataset',              sub: 'Secure encrypted transfer' },
    { key: 'classifyingDataset',   icon: AutoAwesomeIcon,  label: 'AI Detecting Protected Attributes',sub: 'Neural pattern recognition' },
    { key: 'analyzingTarget',      icon: TrendingUpIcon,   label: 'Profiling Target Outcomes',        sub: 'Statistical distribution analysis' },
    { key: 'processingDataset',    icon: BubbleChartIcon,  label: 'Computing Disparate Impact',       sub: 'Running fairness metrics engine' },
    { key: 'generatingBiasReport', icon: ShieldIcon,       label: 'Synthesizing Executive Report',    sub: 'AI generating actionable insights' },
];

// ─── Minimum skeleton display duration (ms) ────────────────────────────────────
const SKELETON_MIN_MS = 4000; // 4 s — feels like real work, not a flash

// ─── Animations ─────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
    initial:    { opacity: 0, y: 24 },
    animate:    { opacity: 1, y: 0  },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
});

const stagger = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const child = {
    hidden: { opacity: 0, y: 28 },
    show:   { opacity: 1, y: 0,  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Shared card style ──────────────────────────────────────────────────────────
const card = (extra = {}) => ({
    borderRadius: '24px',
    background: '#fff',
    border: `1px solid ${G.border}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
    '&:hover': { boxShadow: '0 16px 40px rgba(0,0,0,0.09)', transform: 'translateY(-1px)' },
    ...extra,
});

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1.2 }) {
    const [display, setDisplay] = useState(0);
    const num = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

    useEffect(() => {
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / (duration * 1000), 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(ease * num));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [num, duration]);
    const suffix = String(value).replace(/[0-9.,]/g, '');
    return <>{display.toLocaleString()}{suffix}</>;
}

// ─── SectionLabel ───────────────────────────────────────────────────────────────
function SectionLabel({ color = G.blue, children, icon: Icon }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 4, height: 22, borderRadius: 4, background: `linear-gradient(180deg, ${color}, ${color}88)`, flexShrink: 0 }} />
            {Icon && <Icon sx={{ fontSize: 16, color }} />}
            <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.18em', color: G.mid, textTransform: 'uppercase' }}>
                {children}
            </Typography>
        </Box>
    );
}

// ─── ValueBlock ────────────────────────────────────────────────────────────────
function ValueBlock({ label, value, color = G.dark, highlight = false, animate = false }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: { xs: '0.65rem', sm: '0.7rem' }, color: G.mid, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                {label}
            </Typography>
            <Typography sx={{ 
                fontFamily: "'Syne',sans-serif", fontWeight: 900, 
                fontSize: highlight ? { xs: '2rem', sm: '2.4rem', md: '2.8rem' } : { xs: '1.2rem', sm: '1.35rem', md: '1.5rem' }, 
                color, lineHeight: 1.1, wordBreak: 'break-word', overflowWrap: 'anywhere' 
            }}>
                {animate && highlight ? <AnimatedNumber value={value} /> : value}
            </Typography>
        </Box>
    );
}

// ─── Shimmer Skeleton ──────────────────────────────────────────────────────────
function ShimmerBox({ width = '100%', height, borderRadius = 16, sx = {} }) {
    return (
        <Box sx={{
            width, height, borderRadius, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%)',
            backgroundSize: '400% 100%',
            animation: 'shimmer 1.6s ease-in-out infinite',
            flexShrink: 0,
            ...sx,
        }} />
    );
}

// ─── Skeleton: Section Label Row ───────────────────────────────────────────────
function SkeletonSectionLabel({ width = 160 }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <ShimmerBox width={4} height={22} borderRadius={4} />
            <ShimmerBox width={width} height={12} borderRadius={6} />
        </Box>
    );
}

// ─── Skeleton: MetricCard (sub-metric tile) ────────────────────────────────────
function SkeletonMetricCard({ accent = G.blue, tall = false }) {
    return (
        <Box sx={{
            borderRadius: '24px', background: '#fff', border: `1px solid ${G.border}`,
            p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden',
            minHeight: tall ? 140 : 'auto',
        }}>
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${accent}40, ${accent}80, ${accent}40)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite',
            }} />
            <ShimmerBox width={80} height={10} borderRadius={5} sx={{ mb: 1.5 }} />
            <ShimmerBox width={tall ? 70 : 120} height={tall ? 44 : 28} borderRadius={8} />
        </Box>
    );
}

// ─── Skeleton: Risk Score Hero Card ───────────────────────────────────────────
function SkeletonRiskCard() {
    return (
        <Box sx={{
            borderRadius: '24px',
            background: `linear-gradient(135deg, #2a2b2f 0%, #1a1b1e 100%)`,
            p: { xs: 4, md: 5 },
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 280, gap: 3,
            position: 'relative', overflow: 'hidden',
        }}>
            <Box sx={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at center, rgba(66,133,244,0.12) 0%, transparent 70%)',
                animation: 'pulse-glow 2s ease-in-out infinite',
            }} />
            <ShimmerBox width={130} height={12} borderRadius={6}
                        sx={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)' }} />
            <ShimmerBox width={110} height={90} borderRadius={12}
                        sx={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)' }} />
            <ShimmerBox width={150} height={38} borderRadius={20}
                        sx={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)' }} />
        </Box>
    );
}

// ─── Skeleton: Attribute Tab Panel ────────────────────────────────────────────
function SkeletonAttributePanel() {
    return (
        <Box sx={{ borderRadius: '24px', background: '#fff', border: `1px solid ${G.border}`, overflow: 'hidden', mb: 6 }}>
            {/* Tab bar */}
            <Box sx={{
                display: 'flex', gap: 0, borderBottom: `1px solid ${G.border}`,
                background: G.light, px: 2, py: 0.5, overflowX: 'auto',
            }}>
                {[110, 90, 130, 100].map((w, i) => (
                    <Box key={i} sx={{ px: 3, py: 2.5, flexShrink: 0 }}>
                        <ShimmerBox width={w} height={12} borderRadius={6} />
                    </Box>
                ))}
            </Box>

            <Box sx={{ p: { xs: 3, md: 5 } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 5 }}>
                    {/* Left panel */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Status badge */}
                        <Box sx={{ p: 3, borderRadius: 4, background: G.light, display: 'flex', gap: 2, alignItems: 'center' }}>
                            <ShimmerBox width={36} height={36} borderRadius='50%' />
                            <Box sx={{ flex: 1 }}>
                                <ShimmerBox width={100} height={10} borderRadius={5} sx={{ mb: 1 }} />
                                <ShimmerBox width={150} height={22} borderRadius={6} />
                            </Box>
                        </Box>
                        {/* Metrics 2-col */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            {[0, 1].map(i => (
                                <Box key={i} sx={{ p: 2.5, borderRadius: 3, background: G.light, border: `1px solid ${G.border}` }}>
                                    <ShimmerBox width={80} height={10} borderRadius={5} sx={{ mb: 1.5 }} />
                                    <ShimmerBox width={100} height={28} borderRadius={6} />
                                </Box>
                            ))}
                        </Box>
                        {/* Recommendation */}
                        <Box sx={{ p: 3, borderRadius: 4, background: G.light, borderLeft: `4px solid ${G.border}` }}>
                            <ShimmerBox width={120} height={10} borderRadius={5} sx={{ mb: 1.5 }} />
                            <ShimmerBox width='100%' height={12} borderRadius={5} sx={{ mb: 1 }} />
                            <ShimmerBox width='85%' height={12} borderRadius={5} sx={{ mb: 1 }} />
                            <ShimmerBox width='70%' height={12} borderRadius={5} />
                        </Box>
                    </Box>

                    {/* Chart area */}
                    <Box sx={{
                        minHeight: 360, borderRadius: 4, background: G.light,
                        border: `1px solid ${G.border}`, p: 3,
                        display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-end',
                    }}>
                        {/* Y-axis labels */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%', pt: 4 }}>
                            {[65, 40, 85, 55, 70, 30].map((h, i) => (
                                <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <ShimmerBox width='100%' height={`${h}%`} borderRadius={8} />
                                    <ShimmerBox width='60%' height={10} borderRadius={5} />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// ─── Skeleton: Missingness Warning banner ─────────────────────────────────────
function SkeletonMissingnessWarning() {
    return (
        <Box sx={{
            borderRadius: '24px', background: '#fff', border: `1px solid ${G.border}`,
            p: { xs: 3, md: 4 }, mb: 6,
        }}>
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                <ShimmerBox width={48} height={48} borderRadius={12} sx={{ flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                    <ShimmerBox width='50%' height={20} borderRadius={6} sx={{ mb: 1.5 }} />
                    <ShimmerBox width='90%' height={12} borderRadius={5} sx={{ mb: 1 }} />
                    <ShimmerBox width='75%' height={12} borderRadius={5} sx={{ mb: 2.5 }} />
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {[90, 110, 80].map((w, i) => (
                            <ShimmerBox key={i} width={w} height={28} borderRadius={14} />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// ─── Skeleton: Intersectionality heatmap ──────────────────────────────────────
function SkeletonHeatmap() {
    const COLS = 4;
    const ROWS = 3;
    return (
        <Box sx={{ borderRadius: '24px', background: '#fff', border: `1px solid ${G.border}`, p: { xs: 3, md: 5 }, mb: 6 }}>
            <ShimmerBox width='60%' height={14} borderRadius={6} sx={{ mb: 1 }} />
            <ShimmerBox width='45%' height={12} borderRadius={5} sx={{ mb: 4 }} />
            <Box sx={{ overflowX: 'auto', borderRadius: 4, border: `1px solid ${G.border}`, WebkitOverflowScrolling: 'touch' }}>
                <Box sx={{ minWidth: 500 }}>
                    {/* Header row */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: `160px repeat(${COLS}, 1fr)`, background: G.light, borderBottom: `2px solid ${G.border}`, px: 0 }}>
                        <Box sx={{ p: '16px 20px' }}><ShimmerBox width={80} height={12} borderRadius={5} /></Box>
                        {Array.from({ length: COLS }).map((_, i) => (
                            <Box key={i} sx={{ p: '16px 20px', display: 'flex', justifyContent: 'center' }}>
                                <ShimmerBox width={60} height={12} borderRadius={5} />
                            </Box>
                        ))}
                    </Box>
                    {/* Data rows */}
                    {Array.from({ length: ROWS }).map((_, r) => (
                        <Box key={r} sx={{ display: 'grid', gridTemplateColumns: `160px repeat(${COLS}, 1fr)`, borderBottom: r < ROWS - 1 ? `1px solid ${G.border}` : 'none' }}>
                            <Box sx={{ p: '14px 20px', background: G.light }}>
                                <ShimmerBox width={70} height={12} borderRadius={5} />
                            </Box>
                            {Array.from({ length: COLS }).map((_, c) => (
                                <Box key={c} sx={{ p: '14px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <ShimmerBox width={48} height={24} borderRadius={6} />
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

// ─── Skeleton: Executive Brief card ───────────────────────────────────────────
function SkeletonExecutiveBrief() {
    return (
        <Box sx={{ borderRadius: '24px', background: '#fff', border: `1px solid ${G.border}`, p: { xs: 3, md: 5 }, mb: 5 }}>
            <ShimmerBox width={180} height={14} borderRadius={6} sx={{ mb: 3 }} />
            {[100, 93, 97, 82, 88, 72, 95, 60].map((w, i) => (
                <ShimmerBox key={i} width={`${w}%`} height={13} borderRadius={6} sx={{ mb: 1.5 }} />
            ))}
            <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${G.border}`, display: 'flex', gap: 2 }}>
                <ShimmerBox width={120} height={36} borderRadius={18} />
                <ShimmerBox width={100} height={36} borderRadius={18} />
            </Box>
        </Box>
    );
}

// ─── Skeleton: Mitigation CTA button ──────────────────────────────────────────
function SkeletonCTA() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <ShimmerBox width={280} height={56} borderRadius={60} />
        </Box>
    );
}

// ─── Full Skeleton Dashboard ───────────────────────────────────────────────────
// Renders a full-page skeleton that mirrors the real dashboard layout precisely.
// All sections are included so there is zero layout shift when results arrive.
function SkeletonDashboard() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
            {/* ── 1. Global Health Integrity ── */}
            <SkeletonSectionLabel width={200} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '380px 1fr' }, gap: 3, mb: 6 }}>
                <SkeletonRiskCard />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                    <SkeletonMetricCard accent={G.blue} />
                    <SkeletonMetricCard accent={G.green} />
                    <SkeletonMetricCard accent={G.yellow} />
                    <SkeletonMetricCard accent={G.blue} tall />
                </Box>
            </Box>

            {/* ── 2. Missingness warning (optional — shown probabilistically) ── */}
            <SkeletonMissingnessWarning />

            {/* ── 3. Attribute Bias Drilldown ── */}
            <SkeletonSectionLabel width={220} />
            <SkeletonAttributePanel />

            {/* ── 4. Intersectionality Heatmap ── */}
            <SkeletonSectionLabel width={200} />
            <SkeletonHeatmap />

            {/* ── 5. AI Executive Brief ── */}
            <SkeletonSectionLabel width={160} />
            <SkeletonExecutiveBrief />

            {/* ── 6. Mitigation CTA ── */}
            <SkeletonCTA />
        </motion.div>
    );
}

// ─── Processing Overlay ────────────────────────────────────────────────────────
function ProcessingOverlay({ progressMsg, visible }) {
    const rawMsg = progressMsg || '';
    const stepIndex = useMemo(() => {
        const msgLower = rawMsg.toLowerCase();
        if (msgLower.includes('initializ') || msgLower.includes('pending') || msgLower.includes('workspace')) return 0;
        if (msgLower.includes('download') || msgLower.includes('dataset')) return 1;
        if (msgLower.includes('classif') || msgLower.includes('detect') || msgLower.includes('attribute')) return 2;
        if (msgLower.includes('target') || msgLower.includes('outcome') || msgLower.includes('profil')) return 3;
        if (msgLower.includes('dispar') || msgLower.includes('impact') || msgLower.includes('comput') || msgLower.includes('process')) return 4;
        if (msgLower.includes('report') || msgLower.includes('synth') || msgLower.includes('generat')) return 5;
        return 0;
    }, [rawMsg]);

    useEffect(() => {
        const root = document.getElementById('root');
        if (visible) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            if (root) root.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (root) root.style.overflow = '';
        }
        return () => { 
            document.body.style.overflow = ''; 
            document.documentElement.style.overflow = '';
            if (root) root.style.overflow = '';
        };
    }, [visible]);

    const progress = ((stepIndex + 1) / PROCESSING_STEPS.length) * 100;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ backdropFilter: 'blur(0px)' }}
                        animate={{ backdropFilter: PERF_MODE ? 'none' : 'blur(20px)' }}
                        style={{ position: 'absolute', inset: 0, background: PERF_MODE ? 'rgba(8, 10, 16, 0.95)' : 'rgba(8, 10, 16, 0.88)' }}
                    />

                    {/* Ambient orbs */}
                    {!PERF_MODE && [
                        { color: G.blue,   size: 600, x: '10%',  y: '20%',  delay: 0 },
                        { color: G.green,  size: 500, x: '80%',  y: '60%',  delay: 1 },
                        { color: G.yellow, size: 400, x: '50%',  y: '80%',  delay: 2 },
                        { color: G.red,    size: 350, x: '90%',  y: '10%',  delay: 1.5 },
                    ].map((orb, i) => (
                        <motion.div
                            key={i}
                            animate={{ scale: [1, 1.25, 1], opacity: [0.06, 0.14, 0.06] }}
                            transition={{ duration: 4 + i, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
                            style={{ position: 'absolute', width: orb.size, height: orb.size, borderRadius: '50%', background: orb.color, filter: 'blur(120px)', left: orb.x, top: orb.y, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
                        />
                    ))}

                    {/* Content card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}
                    >
                        <Box sx={{
                            borderRadius: '32px',
                            background: 'rgba(28, 30, 36, 0.95)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                            overflow: 'hidden',
                            position: 'relative',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {/* Top accent bar */}
                            <Box sx={{
                                flexShrink: 0,
                                height: 3,
                                background: `linear-gradient(90deg, ${G.blue}, ${G.green}, ${G.yellow}, ${G.red})`,
                                backgroundSize: '200% 100%',
                                animation: 'slide-gradient 2s linear infinite',
                            }} />

                            <Box sx={{ 
                                flex: 1,
                                minHeight: 0,
                                p: { xs: 4, md: 5 }, 
                                overflowY: 'auto', 
                                overflowX: 'hidden',
                                overscrollBehavior: 'contain',
                                pointerEvents: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '6px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: 'transparent',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                    background: 'rgba(255, 255, 255, 0.25)',
                                },
                            }}>
                                {/* Logo dots + title */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                                <Box sx={{ display: 'flex', gap: 0.6 }}>
                                    {[G.blue, G.red, G.yellow, G.green].map((c, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                            style={{ width: 9, height: 9, borderRadius: '50%', background: c }}
                                        />
                                    ))}
                                </Box>
                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                                    EquiLens Engine
                                </Typography>
                            </Box>

                            {/* Current step label */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={stepIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Typography sx={{ fontFamily: "'Syne'", fontWeight: 900, fontSize: { xs: '1.25rem', md: '1.8rem' }, color: '#fff', mb: 0.5, lineHeight: 1.2 }}>
                                        {PROCESSING_STEPS[stepIndex]?.label}
                                    </Typography>
                                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', mb: 4 }}>
                                        {PROCESSING_STEPS[stepIndex]?.sub}
                                    </Typography>
                                </motion.div>
                            </AnimatePresence>

                            {/* Progress bar */}
                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Progress</Typography>
                                    <Typography sx={{ fontFamily: "'Syne'", fontWeight: 900, fontSize: '0.85rem', color: G.blue }}>{Math.round(progress)}%</Typography>
                                </Box>
                                <Box sx={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <motion.div
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${G.blue}, ${G.green})`, position: 'relative', overflow: 'hidden' }}
                                    >
                                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                                    </motion.div>
                                </Box>
                            </Box>

                            {/* Step list */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {PROCESSING_STEPS.map((step, i) => {
                                    const StepIcon = step.icon;
                                    const done = i < stepIndex;
                                    const active = i === stepIndex;
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: i <= stepIndex + 1 ? 1 : 0.25, x: 0 }}
                                            transition={{ delay: i * 0.05, duration: 0.4 }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, px: 2, borderRadius: 3, background: active ? 'rgba(66,133,244,0.12)' : 'transparent', border: active ? `1px solid rgba(66,133,244,0.2)` : '1px solid transparent', transition: 'all 0.3s' }}>
                                                <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done ? G.green : active ? G.blue : 'rgba(255,255,255,0.06)', transition: 'all 0.4s' }}>
                                                    {done
                                                        ? <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#fff' }} />
                                                        : active
                                                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                                                                <StepIcon sx={{ fontSize: 14, color: '#fff', display: 'block' }} />
                                                            </motion.div>
                                                            : <StepIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                                    }
                                                </Box>
                                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: active ? 700 : 500, fontSize: { xs: '0.75rem', md: '0.82rem' }, color: done ? G.green : active ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {step.label}
                                                </Typography>
                                                {done && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: G.green }} />
                                                    </motion.div>
                                                )}
                                                {active && (
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {[0, 1, 2].map(dot => (
                                                            <motion.div key={dot} animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.2 }}>
                                                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', background: G.blue }} />
                                                            </motion.div>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        </motion.div>
                                    );
                                })}
                            </Box>

                            {/* Disclaimer Box */}
                            <Box sx={{ mt: 5, pt: 4, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                    <Box sx={{ mt: 0.3, p: 0.8, borderRadius: 1.5, background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>⏱️</Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#fff', mb: 0.3 }}>
                                            Processing Time Disclaimer
                                        </Typography>
                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                                            The Bias Audit engine takes up to <strong>1-2 minutes</strong> to Audit the dataset.
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                    <Box sx={{ mt: 0.3, p: 0.8, borderRadius: 1.5, background: 'rgba(52,168,83,0.12)', border: '1px solid rgba(52,168,83,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>✨</Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                                            The Mitigation ML model takes up to <strong>1 minute</strong> to mitigate / fix the dataset.
                                        </Typography>
                                    </Box>
                                </Box>
                                </Box>
                            </Box>
                        </Box>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Main Analyze Page ──────────────────────────────────────────────────────────
export default function Analyze({ injectedState }) {
    const location = useLocation();
    const navigate = useNavigate();
    const state = injectedState || location.state || {};
    const isHistory = !!injectedState?.historyReport;

    const [language,        setLanguage]        = useState('en');
    const [loading,         setLoading]         = useState(false);
    const initialResults = useMemo(() => {
        if (!isHistory || !state.historyReport?.report) return null;
        const r = { ...state.historyReport.report };
        r.target_column = state.historyReport.targetColumn || r.target_column;
        r.protected_columns = state.historyReport.protectedColumns || r.protected_columns;
        r.markdown_report = state.historyReport.markdownReport || state.historyReport.markdown_report || r.markdown_report;
        r.job_id = state.historyReport.jobId || state.historyReport.id || r.job_id;
        return r;
    }, [isHistory, state.historyReport]);

    const [results,         setResults]         = useState(initialResults);
    
    const initialSummary = useMemo(() => {
        if (!isHistory) return null;
        const md = state.historyReport?.markdownReport || state.historyReport?.markdown_report || state.historyReport?.report?.markdown_report;
        return md ? { summary: md } : null;
    }, [isHistory, state.historyReport]);
    const [summary,         setSummary]         = useState(initialSummary);
    
    const initialRecs = useMemo(() => {
        if (!isHistory || !state.historyReport.report?.attribute_analysis) return null;
        const recs = {};
        Object.entries(state.historyReport.report.attribute_analysis).forEach(([col, data]) => {
            if (data.recommendation) recs[col] = data.recommendation;
        });
        return Object.keys(recs).length > 0 ? recs : null;
    }, [isHistory, state.historyReport]);
    const [recommendations, setRecommendations] = useState(initialRecs);
    const [errorState,      setErrorState]      = useState(null);
    const [progressMsg,     setProgressMsg]     = useState('');
    const [activeTab,       setActiveTab]       = useState(0);
    const [tabTransition,   setTabTransition]   = useState(false);

    // ── Skeleton delay state ────────────────────────────────────────────────────
    // `showSkeleton` stays true for at least SKELETON_MIN_MS after an audit
    // starts, even if the API resolves faster — prevents a content flash.
    const [showSkeleton,    setShowSkeleton]    = useState(false);
    const skeletonTimerRef  = useRef(null);
    const apiDoneRef        = useRef(false);   // has the API call finished?

    // Cleanup on unmount
    useEffect(() => () => { clearTimeout(skeletonTimerRef.current); }, []);

    // Called once the minimum skeleton duration elapses
    const onSkeletonTimerDone = useCallback(() => {
        // Only hide skeleton if the API has also finished
        if (apiDoneRef.current) setShowSkeleton(false);
        else skeletonTimerRef.current = null; // timer done but API still running
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (!state.data?.objectPath) return;

        // Reset everything
        clearTimeout(skeletonTimerRef.current);
        apiDoneRef.current = false;
        setLoading(true);
        setShowSkeleton(true);
        setProgressMsg('pending');
        setResults(null); setSummary(null); setRecommendations(null); setErrorState(null);

        // Request notification permission if user wants background notifications
        await requestNotificationPermission();

        // Start minimum skeleton timer
        skeletonTimerRef.current = setTimeout(onSkeletonTimerDone, SKELETON_MIN_MS);

        try {
            const analysisRes = await analyzeDataset(state.data.objectPath, null, (msg) => {
                setProgressMsg(typeof msg === 'string' ? msg : 'processing');
            });

            setResults(analysisRes);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSummary({ summary: analysisRes.markdown_report });

            const recs = {};
            if (analysisRes.attribute_analysis) {
                Object.entries(analysisRes.attribute_analysis).forEach(([col, data]) => {
                    if (data.recommendation) recs[col] = data.recommendation;
                });
            }
            setRecommendations(Object.keys(recs).length > 0 ? recs : null);
            
            sendNotification('Audit Complete', {
                body: 'Your dataset bias audit has finished successfully.'
            });
        } catch (err) {
            console.error(err);
            setErrorState({ code: err.response?.status || '500', title: 'Audit Failed', message: err.message || 'Failed to run mathematical audit.' });
            
            sendNotification('Audit Failed', {
                body: 'There was an error running the dataset audit.'
            });
        } finally {
            setLoading(false);
            apiDoneRef.current = true;
            // If the skeleton timer has already fired, hide the skeleton now;
            // otherwise the timer callback will handle it.
            if (!skeletonTimerRef.current) setShowSkeleton(false);
        }
    }, [state.data, onSkeletonTimerDone]);

    const handleDownloadPDF = useCallback(async () => {
        if (!results?.job_id) return;
        try {
            const blob = await exportReport(results.job_id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bias_Report_${state.data?.file_name || 'Dataset'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) { console.error('PDF export failed:', err); }
    }, [results?.job_id, state.data?.file_name]);

    const handleTabChange = useCallback((e, v) => {
        setTabTransition(true);
        setTimeout(() => { setActiveTab(v); setTabTransition(false); }, 200);
    }, []);

    const globalStats  = results?.global_stats       || {};
    const attrAnalysis = results?.attribute_analysis || {};
    const missingness  = results?.missingness_analysis || {};
    const intersection = results?.intersectionality  || null;

    const attributes  = Object.keys(attrAnalysis);
    const currentAttr = attributes[activeTab] || attributes[0];
    const currentData = attrAnalysis[currentAttr] || {};

    const chartData = useMemo(() => {
        if (!currentData) return [];
        const rates = currentData.selection_rates || currentData.group_means || {};
        return Object.entries(rates).map(([name, rate]) => ({
            name,
            rate: parseFloat((rate * (globalStats.target_type === 'binary' ? 100 : 1)).toFixed(2)),
            total: 0,
        }));
    }, [currentData, globalStats.target_type]);

    const overallSeverity = SEV[globalStats.severity] || SEV.low;

    // Derived visibility flags — single source of truth
    const isWorking     = loading || showSkeleton;       // true while skeleton should show
    const showResults   = results && !isWorking;          // true when skeleton is done

    if (errorState && !isWorking) return <ErrorPage code={errorState.code} title={errorState.title} message={errorState.message} />;

    return (
        <Box sx={{ minHeight: '100vh', background: `linear-gradient(160deg, #eef3ff 0%, ${G.light} 45%, #edfff3 100%)`, pt: { xs: 2, md: 5 }, pb: { xs: 10, md: 16 }, fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
            <SEO title="EquiLens - Analysis Results" />
            <GlobalStyles styles={{
                '@keyframes shimmer': { '0%': { backgroundPosition: '-400% 0' }, '100%': { backgroundPosition: '400% 0' } },
                '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                '@keyframes slide-gradient': { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
                '@keyframes pulse-glow': { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } },
                '@keyframes float': { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-18px)' } },
                '@keyframes orbit': { '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' }, '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' } },
            }} />

            {/* ── Background layers ─── */}
            <Box aria-hidden="true" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {/* Dot grid */}
                <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.09) 1.5px, transparent 1.5px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 100% 80% at 50% 25%, black 0%, transparent 85%)' }} />
                {/* Ambient orbs */}
                {!PERF_MODE && [
                    { c: G.blue,   s: 700, x: '5%',   y: '10%', d: 0,   dur: 7  },
                    { c: G.green,  s: 600, x: '90%',  y: '25%', d: 2,   dur: 9  },
                    { c: G.yellow, s: 500, x: '60%',  y: '80%', d: 1,   dur: 11 },
                    { c: G.red,    s: 400, x: '20%',  y: '70%', d: 3,   dur: 8  },
                ].map((orb, i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.035, 0.07, 0.035] }}
                        transition={{ duration: orb.dur, repeat: Infinity, delay: orb.d, ease: 'easeInOut' }}
                        style={{ position: 'absolute', width: orb.s, height: orb.s, borderRadius: '50%', background: orb.c, filter: 'blur(100px)', left: orb.x, top: orb.y, transform: 'translate(-50%,-50%)' }}
                    />
                ))}
            </Box>

            {/* Processing overlay — only while API is actively running */}
            <ProcessingOverlay progressMsg={progressMsg} visible={loading} />

            <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 2 }}>

                {/* ── Header ── */}
                <motion.div {...fadeUp(0)}>
                    <Box sx={{ mb: { xs: 4, md: 7 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap', gap: { xs: 2, md: 3 } }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Box sx={{ display: 'flex', gap: 0.55 }}>
                                    {[G.blue, G.red, G.yellow, G.green].map((c, i) => (
                                        <motion.div key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                                        </motion.div>
                                    ))}
                                </Box>
                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.15em', color: G.mid, textTransform: 'uppercase' }}>
                                    EquiLens Engine
                                </Typography>
                            </Box>
                            <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: { xs: '2.4rem', sm: '3rem', md: '3.8rem' }, letterSpacing: '-0.03em', color: G.dark, lineHeight: 1.05 }}>
                                Bias{' '}
                                <Box component="span" sx={{ background: `linear-gradient(135deg, ${G.blue} 0%, ${G.green} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    Dashboard
                                </Box>
                            </Typography>
                            {state.data?.file_name && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.9rem', color: G.mid, mt: 1 }}>
                                        Auditing <Box component="span" sx={{ color: G.blue, fontWeight: 800 }}>{state.data.file_name}</Box>
                                    </Typography>
                                </motion.div>
                            )}
                        </Box>

                        {showResults && !isHistory && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleDownloadPDF}
                                    startIcon={<PictureAsPdfIcon />}
                                    sx={{
                                        borderRadius: '14px', borderColor: G.border, color: G.dark, textTransform: 'none', fontWeight: 700,
                                        fontFamily: "'Plus Jakarta Sans'", px: 3, py: 1.3, fontSize: '0.9rem',
                                        backdropFilter: PERF_MODE ? 'none' : 'blur(10px)', background: PERF_MODE ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                                        '&:hover': { borderColor: G.blue, background: `${G.blue}0a`, transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${G.blue}18` },
                                        transition: 'all 0.25s',
                                    }}>
                                    Export PDF Report
                                </Button>
                            </motion.div>
                        )}
                    </Box>
                </motion.div>

                {/* ── Control Panel ── */}
                <motion.div {...fadeUp(0.1)}>
                    <Box sx={{
                        ...card(), mb: 6, p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden',
                        background: PERF_MODE ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.82)', backdropFilter: PERF_MODE ? 'none' : 'blur(20px)',
                    }}>
                        {/* Animated corner accent */}
                        <Box sx={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle at top right, ${G.blue}0a, transparent 70%)`, pointerEvents: 'none' }} />
                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 150, height: 150, background: `radial-gradient(circle at bottom left, ${G.green}08, transparent 70%)`, pointerEvents: 'none' }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 200px auto' }, gap: { xs: 2, md: 3 }, alignItems: 'center', position: 'relative' }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ 
                                    fontFamily: "'Syne'", fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.25rem' }, 
                                    color: G.dark, mb: 0.5,
                                    whiteSpace: 'normal', wordBreak: 'break-all', overflowWrap: 'anywhere' 
                                }}>
                                    {isHistory ? (state.historyReport?.datasetName || 'Historical Audit') : (state.data?.file_name || 'Active Dataset')}
                                </Typography>
                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.88rem', color: G.mid }}>
                                    {showResults ? '✓ Audit dashboard rendered successfully.' : 'Run a deep statistical fairness audit on this dataset.'}
                                </Typography>
                            </Box>

                            <TextField
                                select fullWidth label="Language" value={language}
                                onChange={e => setLanguage(e.target.value)} size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.9rem' } }}
                            >
                                <MenuItem value="en">🇬🇧  English</MenuItem>
                                <MenuItem value="hi">🇮🇳  Hindi</MenuItem>
                                <MenuItem value="bn">🇧🇩  Bengali</MenuItem>
                            </TextField>

                            {!isHistory && (
                            <Button
                                disabled={isWorking}
                                onClick={handleAnalyze}
                                sx={{
                                    height: 52, px: { xs: 4, md: 5 }, borderRadius: '14px',
                                    fontFamily: "'Syne'", fontWeight: 900, textTransform: 'none',
                                    fontSize: '1rem', color: '#fff', whiteSpace: 'nowrap',
                                    background: `linear-gradient(135deg, ${G.blue} 0%, #1a73e8 100%)`,
                                    boxShadow: `0 6px 24px ${G.blue}44`,
                                    '&:not(:disabled):hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 32px ${G.blue}55` },
                                    '&:disabled': { color: 'rgba(255,255,255,0.6)', background: `linear-gradient(135deg, ${G.blue}88, #1a73e888)` },
                                    transition: 'all 0.25s',
                                }}
                            >
                                {isWorking
                                    ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                                        Running…
                                    </Box>
                                    : '✦ Run Audit'
                                }
                            </Button>
                            )}
                        </Box>
                    </Box>
                </motion.div>

                {/* ── Content Area ── */}
                <AnimatePresence mode="wait">

                    {/* Skeleton while loading OR within minimum display window */}
                    {isWorking && (
                        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>
                            <SkeletonDashboard />
                        </motion.div>
                    )}

                    {/* Dashboard results — only once skeleton window is closed */}
                    {showResults && (
                        <motion.div key="results" variants={stagger} initial="hidden" animate="show">

                            {/* ── 1. Global Metrics Hero ── */}
                            <motion.div variants={child}>
                                <SectionLabel color={G.blue} icon={AnalyticsIcon}>Global Health Integrity</SectionLabel>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '380px 1fr' }, gap: 3, mb: 6 }}>

                                    {/* Risk Score Card */}
                                    <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}>
                                        <Box sx={{ ...card(), p: { xs: 3, sm: 4, md: 5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(145deg, #1a1d24 0%, #0f1014 100%)`, color: '#fff', position: 'relative', overflow: 'hidden', minHeight: { xs: 240, sm: 260, md: 280 } }}>
                                            <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${overallSeverity.color}25 0%, transparent 65%)` }} />
                                            {/* Orbit ring */}
                                            <Box sx={{ position: 'absolute', width: { xs: 180, sm: 200, md: 220 }, height: { xs: 180, sm: 200, md: 220 }, borderRadius: '50%', border: `1px solid ${overallSeverity.color}15`, animation: 'pulse-glow 3s ease-in-out infinite' }} />

                                            <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.2em', mb: 2.5, zIndex: 1 }}>
                                                Overall Risk Score
                                            </Typography>

                                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}>
                                                <Typography sx={{ fontFamily: "'Syne'", fontWeight: 900, fontSize: { xs: '3.5rem', sm: '4.5rem', md: '6.5rem' }, lineHeight: 1, textShadow: `0 0 60px ${overallSeverity.color}70`, zIndex: 1, display: 'block' }}>
                                                    {globalStats.overall_risk_score}
                                                </Typography>
                                            </motion.div>

                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                                <Chip
                                                    icon={<overallSeverity.icon style={{ color: '#fff', fontSize: 16 }} />}
                                                    label={overallSeverity.label.toUpperCase()}
                                                    sx={{ mt: 3.5, background: overallSeverity.color, color: '#fff', fontWeight: 900, fontSize: '0.82rem', px: 2, py: 2.5, borderRadius: 3, zIndex: 1, letterSpacing: '0.05em', boxShadow: `0 4px 20px ${overallSeverity.color}50`, '& .MuiChip-icon': { color: '#fff' } }}
                                                />
                                            </motion.div>
                                        </Box>
                                    </motion.div>

                                    {/* Sub-metrics */}
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                        {[
                                            { label: 'Dataset Size', value: globalStats.total_records?.toLocaleString() || '0', accent: G.blue, animate: false },
                                            { label: 'Target Concept', value: results.target_column || 'Unknown', accent: G.green, animate: false },
                                            { label: 'Target Variable Type', value: globalStats.target_type, accent: G.yellow, animate: false },
                                            { label: 'Protected Attributes', value: attributes.length, accent: G.blue, animate: true, highlight: true },
                                        ].map((m, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} whileHover={{ scale: 1.02 }} style={{ borderRadius: 24 }}>
                                                <Box sx={{ ...card(), p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', position: 'relative', overflow: 'hidden' }}>
                                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: m.accent, borderRadius: '24px 24px 0 0' }} />
                                                    <ValueBlock label={m.label} value={m.value} color={m.highlight ? m.accent : G.dark} highlight={m.highlight} animate={m.animate} />
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </Box>
                                </Box>
                            </motion.div>

                            {/* ── 2. Missingness Warning ── */}
                            {Object.keys(missingness).length > 0 && Object.values(missingness).some(m => m.disparity_detected) && (
                                <motion.div variants={child}>
                                    <motion.div whileHover={{ scale: 1.005 }}>
                                        <Box sx={{ ...card(), p: { xs: 3, md: 4 }, mb: 6, border: `2px solid ${G.yellow}60`, background: `linear-gradient(135deg, ${G.yellow}08, transparent)`, position: 'relative', overflow: 'hidden' }}>
                                            <Box sx={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle at top right, ${G.yellow}12, transparent 70%)`, pointerEvents: 'none' }} />
                                            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                                                <Box sx={{ width: 48, height: 48, borderRadius: 3, background: `${G.yellow}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <WarningAmberIcon sx={{ color: '#f57c00', fontSize: 28 }} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: G.dark, mb: 1 }}>
                                                        Data Collection Integrity Warning
                                                    </Typography>
                                                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 500, fontSize: '0.93rem', color: G.mid, mb: 2.5, lineHeight: 1.6 }}>
                                                        Severe statistical differences detected between native and imputed data rows, indicating a structural flaw in data collection methodology.
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                        {Object.entries(missingness).filter(([, v]) => v.disparity_detected).map(([k]) => (
                                                            <Chip key={k} label={`Flawed: ${k}`} size="small" sx={{ fontWeight: 700, background: '#fff', border: `1.5px solid ${G.yellow}`, fontFamily: "'Plus Jakarta Sans'", fontSize: '0.8rem' }} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* ── 3. Attribute Drilldown ── */}
                            {attributes.length > 0 && (
                                <motion.div variants={child}>
                                    <SectionLabel color={G.blue} icon={DataArrayIcon}>Attribute Bias Drilldown</SectionLabel>
                                    <Box sx={{ ...card(), mb: 6, overflow: 'hidden', background: PERF_MODE ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.88)', backdropFilter: PERF_MODE ? 'none' : 'blur(16px)' }}>
                                        {/* Tabs */}
                                        <Tabs
                                            value={activeTab}
                                            onChange={handleTabChange}
                                            variant="scrollable"
                                            scrollButtons="auto"
                                            sx={{
                                                borderBottom: `1px solid ${G.border}`,
                                                background: `linear-gradient(90deg, ${G.light}, rgba(248,249,250,0.6))`,
                                                '& .MuiTab-root': { fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, py: 2.5, px: { xs: 2, md: 3.5 }, fontSize: '0.9rem', color: G.mid, textTransform: 'none', minHeight: 56 },
                                                '& .Mui-selected': { color: `${G.blue} !important`, fontWeight: 800 },
                                                '& .MuiTabs-indicator': { background: `linear-gradient(90deg, ${G.blue}, ${G.green})`, height: 3, borderRadius: '3px 3px 0 0' },
                                            }}
                                        >
                                            {attributes.map((attr) => {
                                                const fail = attrAnalysis[attr]?.status === 'FAIL';
                                                return (
                                                    <Tab
                                                        key={attr}
                                                        icon={fail
                                                            ? <ErrorOutlineIcon sx={{ color: G.red }} fontSize="small" />
                                                            : <CheckCircleOutlineIcon sx={{ color: G.green }} fontSize="small" />
                                                        }
                                                        iconPosition="end"
                                                        label={attr}
                                                    />
                                                );
                                            })}
                                        </Tabs>

                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentAttr}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Box sx={{ p: { xs: 3, md: 5 } }}>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: { xs: 3, md: 5 } }}>

                                                        {/* Left Panel */}
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                            {/* Status Badge */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, borderRadius: 4, background: currentData.status === 'FAIL' ? `${G.red}0c` : `${G.green}0c`, border: `1.5px solid ${currentData.status === 'FAIL' ? G.red : G.green}25` }}>
                                                                <Box sx={{ width: 44, height: 44, borderRadius: '50%', background: currentData.status === 'FAIL' ? `${G.red}18` : `${G.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    {currentData.status === 'FAIL'
                                                                        ? <ErrorOutlineIcon sx={{ fontSize: 26, color: G.red }} />
                                                                        : <CheckCircleOutlineIcon sx={{ fontSize: 26, color: G.green }} />
                                                                    }
                                                                </Box>
                                                                <Box>
                                                                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.72rem', color: currentData.status === 'FAIL' ? G.red : G.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                                        Attribute Status
                                                                    </Typography>
                                                                    <Typography sx={{ fontFamily: "'Syne'", fontWeight: 900, fontSize: '1.35rem', color: G.dark, lineHeight: 1.2 }}>
                                                                        {currentData.status === 'FAIL' ? 'Bias Detected' : 'Fairness Passed'}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            {/* Metrics */}
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                                                {currentData.metric_type === 'categorical_disparity' && (
                                                                    <>
                                                                        <Box sx={{ p: 2.5, borderRadius: 3, background: G.light, border: `1px solid ${G.border}` }}>
                                                                            <ValueBlock label="Adverse Impact" value={currentData.adverse_impact_ratio} />
                                                                        </Box>
                                                                        <Box sx={{ p: 2.5, borderRadius: 3, background: G.light, border: `1px solid ${G.border}` }}>
                                                                            <ValueBlock label="Parity Diff" value={currentData.statistical_parity_difference} />
                                                                        </Box>
                                                                    </>
                                                                )}
                                                                {currentData.metric_type === 'linear_correlation' && (
                                                                    <>
                                                                        <Box sx={{ p: 2.5, borderRadius: 3, background: G.light, border: `1px solid ${G.border}` }}>
                                                                            <ValueBlock label="Pearson R" value={currentData.pearson_r_coefficient} />
                                                                        </Box>
                                                                        <Box sx={{ p: 2.5, borderRadius: 3, background: G.light, border: `1px solid ${G.border}` }}>
                                                                            <ValueBlock label="Stat. Sig." value={currentData.is_statistically_significant ? 'Yes' : 'No'} />
                                                                        </Box>
                                                                    </>
                                                                )}
                                                                {currentData.metric_type === 'continuous_variance_analysis' && (
                                                                    <Box sx={{ p: 2.5, borderRadius: 3, background: G.light, border: `1px solid ${G.border}`, gridColumn: 'span 2' }}>
                                                                        <ValueBlock label="ANOVA / T-Test P-Value" value={currentData.variance_p_value} />
                                                                    </Box>
                                                                )}
                                                            </Box>

                                                            {/* AI Recommendation */}
                                                            {currentData.recommendation && (
                                                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                                                    <Box sx={{ p: 3, borderRadius: 4, background: `${G.blue}06`, borderLeft: `4px solid ${G.blue}`, position: 'relative', overflow: 'hidden' }}>
                                                                        <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${G.blue}08, transparent)` }} />
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                                            <AutoAwesomeIcon sx={{ fontSize: 14, color: G.blue }} />
                                                                            <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.72rem', color: G.blue, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                                                Actionable Advice
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.93rem', color: G.dark, lineHeight: 1.6 }}>
                                                                            {currentData.recommendation}
                                                                        </Typography>
                                                                    </Box>
                                                                </motion.div>
                                                            )}
                                                        </Box>

                                                        {/* Right Panel: Chart */}
                                                        <Box sx={{ minHeight: { xs: 300, md: 400 }, borderRadius: 4, background: G.light, border: `1px solid ${G.border}`, overflow: 'hidden' }}>
                                                            <BiasChart data={chartData} attributeName={currentAttr} />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </motion.div>
                                        </AnimatePresence>
                                    </Box>
                                </motion.div>
                            )}

                            {/* ── 4. Intersectionality Heatmap ── */}
                            {intersection?.matrix && (
                                <motion.div variants={child}>
                                    <SectionLabel color={G.yellow}>Intersectionality Heatmap</SectionLabel>
                                    <Box sx={{ ...card(), mb: 6, p: { xs: 3, md: 5 } }}>
                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.95rem', color: G.mid, mb: 4, lineHeight: 1.6 }}>
                                            Compounded bias between{' '}
                                            <Box component="strong" sx={{ color: G.dark }}>{intersection.attributes[0]}</Box>{' '}and{' '}
                                            <Box component="strong" sx={{ color: G.dark }}>{intersection.attributes[1]}</Box>.{' '}
                                            Values represent target rates.
                                        </Typography>
                                        <Box sx={{ overflowX: 'auto', borderRadius: 4, border: `1px solid ${G.border}`, WebkitOverflowScrolling: 'touch' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                                                <thead>
                                                <tr>
                                                    <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: `2px solid ${G.border}`, background: G.light, color: G.mid, fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.82rem' }}>
                                                        {intersection.attributes[0]} \ {intersection.attributes[1]}
                                                    </th>
                                                    {Object.keys(Object.values(intersection.matrix)[0] || {}).map(col => (
                                                        <th key={col} style={{ padding: '16px 20px', textAlign: 'center', borderBottom: `2px solid ${G.border}`, background: G.light, color: G.dark, fontFamily: "'Syne'", fontWeight: 800, fontSize: '0.9rem' }}>{col}</th>
                                                    ))}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {Object.entries(intersection.matrix).map(([rowKey, colData]) => (
                                                    <tr key={rowKey}>
                                                        <td style={{ padding: '14px 20px', fontWeight: 800, color: G.dark, borderBottom: `1px solid ${G.border}`, fontFamily: "'Syne'", background: G.light }}>{rowKey}</td>
                                                        {Object.entries(colData).map(([colKey, val]) => (
                                                            <td key={colKey} style={{ padding: '14px 20px', textAlign: 'center', borderBottom: `1px solid ${G.border}`, background: `rgba(66,133,244,${val * 0.4})`, transition: 'background 0.2s' }}>
                                                                <Typography sx={{ fontWeight: 800, fontFamily: "'Syne'", color: val > 0.4 ? '#fff' : G.dark, fontSize: '0.95rem' }}>
                                                                    {globalStats.target_type === 'binary' ? `${(val * 100).toFixed(1)}%` : val.toFixed(2)}
                                                                </Typography>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </Box>
                                    </Box>
                                </motion.div>
                            )}

                            {/* ── 5. AI Executive Brief ── */}
                            <motion.div variants={child}>
                                <SectionLabel color={G.green} icon={AutoAwesomeIcon}>AI Executive Brief</SectionLabel>
                                <Box sx={{ ...card({ mb: 5, overflow: 'hidden' }), background: PERF_MODE ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.88)', backdropFilter: PERF_MODE ? 'none' : 'blur(16px)' }}>
                                    <ExplanationBox text={summary?.summary} language={language} onLanguageChange={setLanguage} />
                                </Box>
                            </motion.div>

                            {/* ── 6. Mitigation CTA ── */}
                            {recommendations && (
                                <motion.div variants={child}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.96 }}
                                            style={{ position: 'relative' }}
                                        >
                                            {/* Glow halo behind button */}
                                            <motion.div
                                                animate={{
                                                    opacity: [0.5, 0.85, 0.5],
                                                    scale: [1, 1.08, 1],
                                                }}
                                                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{
                                                    position: 'absolute',
                                                    inset: '-6px',
                                                    borderRadius: '70px',
                                                    background: 'linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)',
                                                    filter: 'blur(18px)',
                                                    zIndex: 0,
                                                    pointerEvents: 'none',
                                                }}
                                            />

                                            <Button
                                                variant="contained"
                                                endIcon={
                                                    <motion.div
                                                        whileHover={{ x: 5 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                                        style={{ display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <ArrowForwardIcon />
                                                    </motion.div>
                                                }
                                                onClick={() => navigate('/recommendation', { state: { recommendations, data: state.data, results } })}
                                                sx={{
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    fontFamily: "'Syne'",
                                                    fontWeight: 900,
                                                    fontSize: { xs: '1rem', md: '1.1rem' },
                                                    textTransform: 'none',
                                                    px: { xs: 4, md: 7 },
                                                    py: 2.2,
                                                    borderRadius: '60px',
                                                    color: '#fff',
                                                    letterSpacing: '0.02em',

                                                    // Rich 4-stop gradient
                                                    background: 'linear-gradient(120deg, #6366f1 0%, #3b82f6 40%, #06b6d4 75%, #818cf8 100%)',
                                                    backgroundSize: '200% 200%',
                                                    backgroundPosition: '0% 50%',

                                                    // Border shimmer ring
                                                    outline: '1.5px solid rgba(255,255,255,0.18)',
                                                    outlineOffset: '1px',

                                                    boxShadow: '0 8px 32px rgba(99,102,241,0.35), 0 2px 8px rgba(6,182,212,0.2)',

                                                    // Shimmer pseudo-element
                                                    overflow: 'hidden',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: '-75%',
                                                        width: '50%',
                                                        height: '100%',
                                                        background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
                                                        transform: 'skewX(-20deg)',
                                                        transition: 'none',
                                                    },

                                                    '&:hover': {
                                                        backgroundPosition: '100% 50%',
                                                        boxShadow: '0 14px 48px rgba(99,102,241,0.55), 0 4px 16px rgba(6,182,212,0.35)',
                                                        outline: '1.5px solid rgba(255,255,255,0.32)',

                                                        // Trigger shimmer sweep on hover
                                                        '&::before': {
                                                            left: '125%',
                                                            transition: 'left 0.65s ease',
                                                        },
                                                    },

                                                    transition: [
                                                        'background-position 0.6s ease',
                                                        'box-shadow 0.35s ease',
                                                        'outline 0.35s ease',
                                                    ].join(', '),
                                                }}
                                            >
                                                Explore Fixes & Data Mitigations
                                            </Button>
                                        </motion.div>
                                    </Box>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Pre-Run State ── */}
                {!results && !isWorking && (
                    <motion.div {...fadeUp(0.2)}>
                        <Box sx={{ ...card({ p: { xs: 5, md: 10 }, textAlign: 'center' }), background: PERF_MODE ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)', backdropFilter: PERF_MODE ? 'none' : 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
                            {/* BG decoration */}
                            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                {[G.blue, G.green, G.yellow, G.red].map((c, i) => (
                                    <Box key={i} sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: c, filter: 'blur(80px)', opacity: 0.04, left: `${[15, 65, 80, 25][i]}%`, top: `${[20, 10, 70, 75][i]}%`, transform: 'translate(-50%,-50%)' }} />
                                ))}
                            </Box>

                            {/* Animated dot grid */}
                            <Box sx={{ display: 'inline-flex', gap: { xs: 0.8, md: 1.2 }, mb: { xs: 4, md: 5 }, flexWrap: 'wrap', justifyContent: 'center', maxWidth: { xs: 180, md: 220 }, position: 'relative' }}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={PERF_MODE ? { opacity: [0.4, 1, 0.4] } : { scale: [1, 1.5, 1], opacity: [0.25, 1, 0.25] }}
                                        transition={{ duration: PERF_MODE ? 3 : 2.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                                    >
                                        <Box sx={{ width: { xs: 7, md: 9 }, height: { xs: 7, md: 9 }, borderRadius: '50%', background: [G.blue, G.red, G.yellow, G.green][i % 4] }} />
                                    </motion.div>
                                ))}
                            </Box>

                            <Typography sx={{ fontFamily: "'Syne'", fontWeight: 900, fontSize: { xs: '1.4rem', md: '2.2rem' }, color: G.dark, mb: 1.5, letterSpacing: '-0.02em' }}>
                                Ready to Audit
                            </Typography>
                            <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: { xs: '0.95rem', md: '1.05rem' }, color: G.mid, maxWidth: 440, mx: 'auto', lineHeight: 1.7 }}>
                                Click{' '}
                                <Box component="strong" sx={{ color: G.blue }}>Run Audit</Box>
                                {' '}above to run deep statistical bias analysis across all protected attributes in your dataset.
                            </Typography>
                        </Box>
                    </motion.div>
                )}
            </Box>
        </Box>
    );
}