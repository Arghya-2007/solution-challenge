import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Alert, TextField, MenuItem, Button,
    Snackbar, GlobalStyles
} from '@mui/material';
import {
    PictureAsPdf as PictureAsPdfIcon,
    Language as LanguageIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircleOutlined as CheckCircleOutlineIcon,
    ErrorOutlined as ErrorOutlineIcon,
    WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    analyzeDataset,
    getSummary,
    getRecommendations,
    exportReport
} from '../api/equilens';
import MetricCard from '../components/MetricCard';
import BiasChart from '../components/BiasChart';
import ExplanationBox from '../components/ExplanationBox';

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
};

// ─── Severity config ────────────────────────────────────────────────────────────
const SEV = {
    critical: { color: G.red,    icon: ErrorOutlineIcon,   label: 'Critical',  bg: `${G.red}0f`    },
    medium:   { color: G.yellow, icon: WarningAmberIcon,   label: 'Medium',    bg: `${G.yellow}0f` },
    low:      { color: G.green,  icon: CheckCircleOutlineIcon, label: 'Low',   bg: `${G.green}0f`  },
};

// ─── Lightweight fade-up entrance ──────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
    initial:    { opacity: 0, y: 18 },
    animate:    { opacity: 1, y: 0  },
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1], delay },
});

const stagger = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const child = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Shared card style (no backdropFilter — kills perf on many cards) ──────────
const card = (extra = {}) => ({
    borderRadius: '20px',
    background: '#fff',
    border: `1px solid ${G.border}`,
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.22s ease, transform 0.22s ease',
    '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.10)' },
    ...extra,
});

// ─── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ color = G.blue, children }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ width: 4, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
            <Typography sx={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.10em',
                color: G.mid, textTransform: 'uppercase',
            }}>
                {children}
            </Typography>
        </Box>
    );
}

// ─── Metric skeleton card ───────────────────────────────────────────────────────
function MetricSkeleton() {
    return (
        <Box sx={{ ...card(), p: 3, minHeight: 160 }}>
            <Skeleton width="55%" height={14} style={{ marginBottom: 12 }} />
            <Skeleton width="38%" height={44} style={{ marginBottom: 10 }} />
            <Skeleton width="70%" height={11} />
        </Box>
    );
}

// ─── Analyze ────────────────────────────────────────────────────────────────────
export default function Analyze() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};

    const [language,         setLanguage]         = useState('en');
    const [loading,          setLoading]          = useState(false);
    const [results,          setResults]          = useState(null);
    const [summary,          setSummary]          = useState(null);
    const [recommendations,  setRecommendations]  = useState(null);
    const [protectedAttrs,   setProtectedAttrs]   = useState([]);
    const [targetColumn,     setTargetColumn]     = useState('');
    const [snackOpen,        setSnackOpen]        = useState(false);
    const [snackMsg,         setSnackMsg]         = useState('');
    const [snackSev,         setSnackSev]         = useState('error');

    const toast = useCallback((msg, sev = 'error') => {
        setSnackMsg(msg); setSnackSev(sev); setSnackOpen(true);
    }, []);

    const handleAnalyze = async () => {
        setLoading(true);
        setResults(null); setSummary(null); setRecommendations(null);
        try {
            const analysisRes = await analyzeDataset();
            setResults(analysisRes);
            setTargetColumn(analysisRes.bias_audit?.target_column || '');
            const flagged = Object.keys(analysisRes.bias_audit?.flagged_features || {});
            setProtectedAttrs(flagged);

            await new Promise(resolve => setTimeout(resolve, 2500));
            
            const summaryRes = await getSummary(analysisRes.fairness_metrics || {}, language);
            setSummary(summaryRes);

            await new Promise(resolve => setTimeout(resolve, 2500));
            
            const recsRes = await getRecommendations();
            setRecommendations(recsRes);
        } catch (err) {
            console.error(err);
            toast('Failed to run analysis. Ensure a dataset is uploaded.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const blob = await exportReport();
            const url = URL.createObjectURL(new Blob([blob]));
            const a = Object.assign(document.createElement('a'), { href: url, download: 'EquiLens_Audit_Report.pdf' });
            document.body.appendChild(a); a.click(); a.remove();
        } catch (err) {
            console.error(err); toast('PDF generation failed.');
        }
    };

    // Re-fetch summary when language changes
    useEffect(() => {
        if (!results) return;
        getSummary(results.fairness_metrics || {}, language)
            .then(setSummary)
            .catch(() => toast('Language switch failed.', 'warning'));
    }, [language]); // eslint-disable-line

    // ── Derived data ────────────────────────────────────────────────────────────
    const fairnessData   = results?.fairness_metrics || {};
    const severity       = fairnessData.severity || 'low';
    const sevCfg         = SEV[severity] || SEV.low;
    const SevIcon        = sevCfg.icon;
    const metricsArray   = fairnessData.metrics || [];
    const rawCounts      = fairnessData.raw_counts?.by_sensitive_feature || {};
    const activeAttr     = protectedAttrs[0] || metricsArray[0]?.feature || null;
    const dpdMetric      = metricsArray.find(m => m.feature === activeAttr) || { value: 0, threshold: 0.1, pass: true };

    let chartData = [], totalApplicants = 0, minRate = Infinity, maxRate = -Infinity;
    if (activeAttr && rawCounts[activeAttr]) {
        Object.entries(rawCounts[activeAttr]).forEach(([key, v]) => {
            const rate = v.positive_rate || 0, total = v.total_in_group || 0;
            chartData.push({ name: key, rate, total });
            totalApplicants += total;
            if (rate < minRate) minRate = rate;
            if (rate > maxRate) maxRate = rate;
        });
    }
    const disparateImpact = (maxRate > 0 && minRate !== Infinity) ? minRate / maxRate : 1.0;
    const diPass = disparateImpact >= 0.8;

    // ── Input field style ────────────────────────────────────────────────────────
    const inputSx = {
        '& .MuiInputLabel-root': { color: G.mid, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" },
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: G.light,
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 600,
            '& fieldset': { borderColor: G.border },
            '&:hover fieldset': { borderColor: `${G.blue}60` },
            '&.Mui-focused': {
                background: '#fff',
                '& fieldset': { borderColor: G.blue },
            },
        },
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: `linear-gradient(160deg, #f0f4ff 0%, ${G.light} 50%, #f4fff7 100%)`,
            pt: { xs: 3, md: 5 }, pb: 14,
            position: 'relative', overflow: 'hidden',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            <GlobalStyles styles={{
                '@keyframes gradientRail': {
                    '0%,100%': { backgroundPosition: '0% 50%' },
                    '50%':     { backgroundPosition: '100% 50%' },
                },
                '@keyframes glowPulse': {
                    '0%,100%': { opacity: '0.20' },
                    '50%':     { opacity: '0.38' },
                },
                '@keyframes blobDrift': {
                    '0%,100%': { transform: 'translate(0,0)'        },
                    '50%':     { transform: 'translate(16px,-12px)' },
                },
                '@keyframes shimmer': {
                    '0%':   { transform: 'translateX(-120%) skewX(-18deg)' },
                    '100%': { transform: 'translateX(320%) skewX(-18deg)'  },
                },
                '@keyframes scanAcross': {
                    '0%':   { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(400%)'  },
                },
            }} />

            {/* ── Lightweight background blobs — transform only, no filter:blur ── */}
            <Box aria-hidden="true" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                    { c: '66,133,244', t: '-18%', l: '-12%', s: '54vw', dur: '19s' },
                    { c: '234,67,53',  t: '-2%',  r: '-16%', s: '50vw', dur: '26s', rev: true },
                    { c: '52,168,83',  b: '-20%', l: '4%',   s: '52vw', dur: '22s' },
                    { c: '251,188,5',  b: '-8%',  r: '-4%',  s: '42vw', dur: '17s', rev: true },
                ].map((b, i) => (
                    <Box key={i} sx={{
                        position: 'absolute',
                        width: b.s, height: b.s, borderRadius: '50%',
                        top: b.t, left: b.l, right: b.r, bottom: b.b,
                        background: `radial-gradient(circle, rgba(${b.c},0.15) 0%, rgba(${b.c},0.05) 50%, transparent 70%)`,
                        willChange: 'transform',
                        animation: `blobDrift ${b.dur} ease-in-out infinite ${b.rev ? 'reverse' : ''}`,
                        animationDelay: `${i * -4}s`,
                    }} />
                ))}
                <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(248,249,250,0.60)' }} />
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.07) 1.2px, transparent 1.2px)',
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black 10%, transparent 90%)',
                }} />
            </Box>

            <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2, md: 4 }, position: 'relative', zIndex: 2 }}>

                {/* ══ PAGE HEADER ════════════════════════════════════════════════ */}
                <motion.div {...fadeUp(0)}>
                    <Box sx={{ mb: { xs: 5, md: 7 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', gap: 2 }}>
                        <Box>
                            {/* Wordmark with Google-dot accent */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 0.55 }}>
                                    {[G.blue, G.red, G.yellow, G.green].map((c, i) => (
                                        <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 7px ${c}80` }} />
                                    ))}
                                </Box>
                                <Typography sx={{
                                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                                    fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em',
                                    color: G.mid, textTransform: 'uppercase',
                                }}>
                                    EquiLens Engine
                                </Typography>
                            </Box>

                            <Typography sx={{
                                fontFamily: "'Syne',sans-serif",
                                fontWeight: 900, fontSize: { xs: '2rem', md: '3rem' },
                                letterSpacing: '-0.03em', color: G.dark, lineHeight: 1.1,
                            }}>
                                Bias{' '}
                                <Box component="span" sx={{
                                    background: `linear-gradient(135deg, ${G.blue}, ${G.green})`,
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    Audit
                                </Box>
                            </Typography>

                            <Typography sx={{
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                fontWeight: 600, fontSize: '0.95rem', color: G.mid, mt: 0.8,
                            }}>
                                {state.data?.file_name
                                    ? `Analyzing: ${state.data.file_name}`
                                    : 'AI-powered fairness analysis for your dataset'}
                            </Typography>
                        </Box>

                        {/* PDF button — visible after results */}
                        <AnimatePresence>
                            {results && !loading && (
                                <motion.div {...fadeUp(0.1)}>
                                    <Button
                                        startIcon={<PictureAsPdfIcon />}
                                        onClick={handleDownloadPDF}
                                        sx={{
                                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                                            fontWeight: 700, borderRadius: '12px',
                                            border: `1.5px solid ${G.blue}40`,
                                            color: G.blue, textTransform: 'none',
                                            px: 2.5, py: 1.1,
                                            background: `${G.blue}08`,
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                background: `${G.blue}14`,
                                                borderColor: `${G.blue}80`,
                                                transform: 'translateY(-1px)',
                                                boxShadow: `0 6px 20px ${G.blue}20`,
                                            },
                                        }}>
                                        Export Report
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>
                </motion.div>

                {/* ══ CONTROL PANEL ══════════════════════════════════════════════ */}
                <motion.div {...fadeUp(0.08)}>
                    <Box sx={{
                        ...card(),
                        mb: 6, p: { xs: 3, md: 4 },
                        position: 'relative', overflow: 'hidden',
                        // Rainbow rail on top — CSS only
                        '&::before': {
                            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                            borderRadius: '20px 20px 0 0',
                            background: `linear-gradient(90deg,${G.blue},${G.red},${G.yellow},${G.green},${G.blue})`,
                            backgroundSize: '250% 100%',
                            animation: 'gradientRail 4s linear infinite',
                        },
                    }}>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr auto', md: '1fr 220px auto' },
                            gap: { xs: 2.5, md: 3 },
                            alignItems: 'center',
                            pt: 1,
                        }}>
                            {/* Dataset info */}
                            <Box>
                                <SectionLabel color={G.blue}>Dataset Ready</SectionLabel>
                                <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: { xs: '1.12rem', md: '1.28rem' }, color: G.dark, mb: 0.5 }}>
                                    {state.data?.file_name || 'Active Dataset'}
                                </Typography>
                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: '0.88rem', color: G.mid }}>
                                    AI will auto-detect protected attributes and target outcomes.
                                </Typography>
                            </Box>

                            {/* Language selector */}
                            <TextField
                                select fullWidth label="Language" value={language}
                                onChange={e => setLanguage(e.target.value)}
                                sx={inputSx}
                                InputProps={{ startAdornment: <LanguageIcon sx={{ mr: 1, color: G.blue, fontSize: 20 }} /> }}>
                                <MenuItem value="en">English</MenuItem>
                                <MenuItem value="hi">Hindi</MenuItem>
                                <MenuItem value="bn">Bengali</MenuItem>
                                <MenuItem value="ta">Tamil</MenuItem>
                            </TextField>

                            {/* CTA */}
                            <Button
                                disabled={loading}
                                onClick={handleAnalyze}
                                sx={{
                                    height: 52, px: { xs: 4, md: 5 },
                                    borderRadius: '14px',
                                    fontFamily: "'Syne',sans-serif",
                                    fontWeight: 900, fontSize: '1rem',
                                    textTransform: 'none', color: '#fff',
                                    background: `linear-gradient(135deg, ${G.blue} 0%, #1a73e8 100%)`,
                                    backgroundSize: '200% 100%',
                                    boxShadow: `0 6px 22px ${G.blue}38`,
                                    position: 'relative', overflow: 'hidden',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    whiteSpace: 'nowrap',
                                    '&::after': {
                                        content: '""', position: 'absolute', inset: 0,
                                        background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                                        transform: 'translateX(-120%) skewX(-18deg)',
                                    },
                                    '&:not(:disabled):hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 10px 32px ${G.blue}48`,
                                    },
                                    '&:not(:disabled):hover::after': { animation: 'shimmer 0.5s ease 1' },
                                    '&:disabled': { background: '#e8eaed', color: '#bdc1c6', boxShadow: 'none' },
                                }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                        {/* Mini spinner — CSS only */}
                                        <Box sx={{
                                            width: 16, height: 16, borderRadius: '50%',
                                            border: '2.5px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            animation: 'spin 0.8s linear infinite',
                                        }} />
                                        Analyzing…
                                    </Box>
                                ) : '✦ Run Audit'}
                            </Button>
                        </Box>
                    </Box>
                </motion.div>

                {/* CSS spinner keyframe — minimal, inline */}
                <GlobalStyles styles={{ '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />

                {/* ══ LOADING STATE ══════════════════════════════════════════════ */}
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {/* Scanning bar */}
                            <Box sx={{
                                mb: 5, height: 3, borderRadius: 2,
                                background: 'rgba(66,133,244,0.10)',
                                overflow: 'hidden', position: 'relative',
                            }}>
                                <Box sx={{
                                    position: 'absolute', top: 0, bottom: 0, width: '35%',
                                    background: `linear-gradient(90deg, transparent, ${G.blue}, ${G.green}, transparent)`,
                                    borderRadius: 2,
                                    animation: 'scanAcross 1.5s ease-in-out infinite',
                                }} />
                            </Box>

                            <SectionLabel color={G.blue}>Metrics</SectionLabel>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
                                {[1,2,3].map(i => <MetricSkeleton key={i} />)}
                            </Box>

                            <SectionLabel color={G.red}>Bias Distribution</SectionLabel>
                            <Box sx={{ ...card(), p: 4, mb: 4 }}>
                                <Skeleton height={320} borderRadius={12} />
                            </Box>

                            <SectionLabel color={G.green}>AI Explanation</SectionLabel>
                            <Box sx={{ ...card(), p: 4 }}>
                                <Skeleton count={4} height={18} style={{ marginBottom: 10 }} />
                                <Skeleton width="60%" height={18} />
                            </Box>
                        </motion.div>
                    )}

                    {/* ══ RESULTS ════════════════════════════════════════════════ */}
                    {results && !loading && (
                        <motion.div key="results" variants={stagger} initial="hidden" animate="show">

                            {/* ── Severity banner ──────────────────────────────── */}
                            <motion.div variants={child}>
                                <Box sx={{
                                    mb: 5, p: { xs: 2.5, md: 3 },
                                    borderRadius: '18px',
                                    background: sevCfg.bg,
                                    border: `1.5px solid ${sevCfg.color}28`,
                                    boxShadow: `0 4px 20px ${sevCfg.color}14`,
                                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    {/* Left accent bar */}
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: sevCfg.color, borderRadius: '18px 0 0 18px' }} />

                                    <Box sx={{ pl: 1.5, display: 'flex', alignItems: 'center', gap: 1.8 }}>
                                        <Box sx={{
                                            p: 1.2, borderRadius: '12px',
                                            background: `${sevCfg.color}18`,
                                            display: 'flex',
                                        }}>
                                            <SevIcon sx={{ color: sevCfg.color, fontSize: 26 }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{
                                                fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                                fontSize: { xs: '1rem', md: '1.18rem' }, color: G.dark,
                                            }}>
                                                Audit Complete —{' '}
                                                <Box component="span" sx={{ color: sevCfg.color }}>
                                                    {sevCfg.label} Severity
                                                </Box>
                                            </Typography>
                                            <Typography sx={{
                                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                                fontWeight: 600, fontSize: '0.86rem', color: G.mid,
                                            }}>
                                                Analyzed {totalApplicants.toLocaleString()} records for&nbsp;
                                                <strong style={{ color: G.dark }}>"{targetColumn}"</strong>
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ flexGrow: 1 }} />

                                    {/* Pill badges for detected attributes */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {protectedAttrs.map((attr, i) => (
                                            <Box key={i} sx={{
                                                px: 1.8, py: 0.5, borderRadius: 100,
                                                background: `${[G.blue, G.red, G.yellow, G.green][i % 4]}14`,
                                                border: `1px solid ${[G.blue, G.red, G.yellow, G.green][i % 4]}28`,
                                            }}>
                                                <Typography sx={{
                                                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                                                    fontWeight: 700, fontSize: '0.72rem',
                                                    color: [G.blue, G.red, G.yellow, G.green][i % 4],
                                                }}>
                                                    {attr}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </motion.div>

                            {/* ── Metric cards ─────────────────────────────────── */}
                            <motion.div variants={child}>
                                <SectionLabel color={G.blue}>Fairness Metrics</SectionLabel>
                            </motion.div>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 5 }}>
                                {[
                                    {
                                        title: 'Demographic Parity',
                                        value: dpdMetric.value, passed: dpdMetric.pass,
                                        tooltip: 'Difference in positive outcome rates between groups.',
                                        accent: G.blue,
                                    },
                                    {
                                        title: 'Disparate Impact',
                                        value: parseFloat(disparateImpact.toFixed(3)), passed: diPass,
                                        tooltip: 'Ratio of positive rates: unprivileged ÷ privileged group.',
                                        accent: G.yellow,
                                    },
                                    {
                                        title: 'Sensitive Features',
                                        value: protectedAttrs.length, passed: protectedAttrs.length > 0,
                                        tooltip: 'Number of protected or proxy attributes detected.',
                                        accent: G.green,
                                    },
                                ].map((m, i) => (
                                    <motion.div key={i} variants={child}>
                                        <Box sx={{
                                            ...card({
                                                p: 3, height: '100%',
                                                // Top colored stripe per metric
                                                '&::before': {
                                                    content: '""', display: 'block',
                                                    height: 3, borderRadius: '20px 20px 0 0',
                                                    background: m.accent,
                                                    mx: -3, mt: -3, mb: 2.5,
                                                    opacity: 0.6,
                                                },
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: `0 14px 36px ${m.accent}18, 0 2px 8px rgba(0,0,0,0.06)`,
                                                },
                                            }),
                                            overflow: 'hidden', position: 'relative',
                                        }}>
                                            <MetricCard
                                                title={m.title}
                                                value={m.value}
                                                passed={m.passed}
                                                tooltip={m.tooltip}
                                            />
                                        </Box>
                                    </motion.div>
                                ))}
                            </Box>

                            {/* ── Bias chart ───────────────────────────────────── */}
                            <motion.div variants={child}>
                                <SectionLabel color={G.red}>Bias Distribution</SectionLabel>
                                <Box sx={{ ...card({ mb: 5, p: { xs: 2.5, md: 4 } }) }}>
                                    <BiasChart
                                        data={chartData}
                                        attributeName={activeAttr || 'Protected Attribute'}
                                    />
                                </Box>
                            </motion.div>

                            {/* ── AI Explanation ───────────────────────────────── */}
                            <motion.div variants={child}>
                                <SectionLabel color={G.green}>AI Explanation</SectionLabel>
                                <Box sx={{
                                    ...card({ mb: 5, overflow: 'hidden' }),
                                    // Subtle glow when summary loaded
                                    boxShadow: summary
                                        ? `0 4px 28px ${G.green}12, 0 2px 8px rgba(0,0,0,0.05)`
                                        : undefined,
                                }}>
                                    <ExplanationBox
                                        text={summary?.summary}
                                        worstGroup={summary?.worst_affected_group}
                                        worstFactor={summary?.discrimination_factor}
                                        suggestedFix={summary?.fix_action}
                                        language={language}
                                        onLanguageChange={setLanguage}
                                    />
                                </Box>
                            </motion.div>

                            {/* ── Mitigation CTA ───────────────────────────────── */}
                            {recommendations && (
                                <motion.div variants={child}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            endIcon={<ArrowForwardIcon />}
                                            onClick={() => navigate('/recommendation', { state: { recommendations } })}
                                            sx={{
                                                fontFamily: "'Syne',sans-serif",
                                                fontWeight: 900, fontSize: { xs: '0.95rem', md: '1.05rem' },
                                                textTransform: 'none',
                                                px: { xs: 3.5, md: 5 }, py: 1.8,
                                                borderRadius: '50px',
                                                background: `linear-gradient(90deg,${G.blue},${G.red},${G.yellow},${G.green},${G.blue})`,
                                                backgroundSize: '300% 100%',
                                                animation: 'gradientRail 4s linear infinite',
                                                boxShadow: `0 8px 28px ${G.blue}30`,
                                                color: '#fff',
                                                position: 'relative', overflow: 'hidden',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&::after': {
                                                    content: '""', position: 'absolute', inset: 0,
                                                    background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.20) 50%, transparent 70%)',
                                                    transform: 'translateX(-120%) skewX(-18deg)',
                                                },
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: `0 14px 40px ${G.blue}40`,
                                                },
                                                '&:hover::after': { animation: 'shimmer 0.55s ease 1' },
                                            }}>
                                            View Mitigation Strategies &amp; Fixes
                                        </Button>
                                    </Box>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Empty state (pre-run) ─────────────────────────────────── */}
                {!results && !loading && (
                    <motion.div {...fadeUp(0.22)}>
                        <Box sx={{
                            ...card({ p: { xs: 6, md: 10 }, textAlign: 'center' }),
                            background: 'rgba(255,255,255,0.75)',
                        }}>
                            {/* Decorative grid of dots */}
                            <Box sx={{
                                display: 'inline-flex', gap: 1.2, mb: 4, flexWrap: 'wrap',
                                justifyContent: 'center', maxWidth: 200,
                            }}>
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <Box key={i} sx={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: [G.blue, G.red, G.yellow, G.green][i % 4],
                                        opacity: 0.28 + (i % 3) * 0.18,
                                    }} />
                                ))}
                            </Box>

                            <Typography sx={{
                                fontFamily: "'Syne',sans-serif",
                                fontWeight: 900, fontSize: { xs: '1.5rem', md: '2rem' },
                                color: G.dark, mb: 1.5, letterSpacing: '-0.02em',
                            }}>
                                Ready to Audit
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                fontWeight: 600, fontSize: '1rem',
                                color: G.mid, maxWidth: 420, mx: 'auto',
                            }}>
                                Click <strong style={{ color: G.blue }}>Run Audit</strong> above to analyze your dataset for hidden bias across all protected attributes.
                            </Typography>

                            {/* Feature pills */}
                            <Box sx={{ display: 'flex', gap: 1.5, mt: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {['Demographic Parity', 'Disparate Impact', 'Feature Detection', 'AI Explanation'].map((f, i) => (
                                    <Box key={i} sx={{
                                        px: 2.2, py: 0.7, borderRadius: 100,
                                        background: `${[G.blue, G.red, G.yellow, G.green][i]}0d`,
                                        border: `1px solid ${[G.blue, G.red, G.yellow, G.green][i]}20`,
                                    }}>
                                        <Typography sx={{
                                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                                            fontWeight: 700, fontSize: '0.78rem',
                                            color: [G.blue, G.red, G.yellow, G.green][i],
                                        }}>
                                            {f}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </motion.div>
                )}
            </Box>

            {/* ── Snackbar ─────────────────────────────────────────────────── */}
            <Snackbar
                open={snackOpen} autoHideDuration={5000}
                onClose={() => setSnackOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert
                    severity={snackSev}
                    onClose={() => setSnackOpen(false)}
                    sx={{
                        borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                    }}>
                    {snackMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

