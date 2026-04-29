import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Divider, Snackbar, Alert, GlobalStyles
} from '@mui/material';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion, AnimatePresence } from 'framer-motion';
import { applyFix, downloadFixedDataset } from '../api/equilens';

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

const G_COLORS = [G.blue, G.red, G.yellow, G.green];

// ─── Shared card style ─────────────────────────────────────────────────────────
const card = (extra = {}) => ({
    borderRadius: '20px',
    background: '#fff',
    border: `1px solid ${G.border}`,
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.22s ease, transform 0.22s ease',
    ...extra,
});

// ─── Entrance variants ─────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
    initial:    { opacity: 0, y: 18 },
    animate:    { opacity: 1, y: 0  },
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1], delay },
});

const stagger = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const child = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ color = G.blue, children }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Box sx={{ width: 4, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
            <Typography sx={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 700, fontSize: '0.72rem',
                letterSpacing: '0.10em', color: G.mid,
                textTransform: 'uppercase',
            }}>
                {children}
            </Typography>
        </Box>
    );
}

// ─── Category color picker ─────────────────────────────────────────────────────
const catColor = (cat = '') => {
    const map = {
        'pre-processing':  G.blue,
        'in-processing':   G.green,
        'post-processing': G.yellow,
        'data':            G.blue,
        'model':           G.red,
    };
    const key = Object.keys(map).find(k => cat.toLowerCase().includes(k));
    return key ? map[key] : G.blue;
};

// ─── Recommendation card ────────────────────────────────────────────────────────
function RecCard({ rec, index }) {
    const accent = catColor(rec.category);
    return (
        <Box sx={{
            ...card({
                p: 3.5, height: '100%', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', position: 'relative',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 14px 36px ${accent}14, 0 2px 8px rgba(0,0,0,0.06)`,
                    borderColor: `${accent}28`,
                },
            }),
        }}>
            {/* Colored top accent stripe */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: accent, borderRadius: '20px 20px 0 0', opacity: 0.7,
            }} />

            {/* Index bubble */}
            <Box sx={{
                position: 'absolute', top: 16, right: 16,
                width: 28, height: 28, borderRadius: '50%',
                background: `${accent}12`, border: `1.5px solid ${accent}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: '0.72rem', color: accent }}>
                    {String(index + 1).padStart(2, '0')}
                </Typography>
            </Box>

            {/* Category chip */}
            <Box sx={{
                display: 'inline-flex', mb: 2, px: 1.6, py: 0.5, borderRadius: 100,
                background: `${accent}0e`, border: `1px solid ${accent}22`,
                alignSelf: 'flex-start',
            }}>
                <Typography sx={{
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontWeight: 700, fontSize: '0.7rem',
                    color: accent, letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                    {rec.category}
                </Typography>
            </Box>

            <Typography sx={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.15rem' },
                color: G.dark, letterSpacing: '-0.01em', mb: 1.2,
                pr: 4, // avoid overlap with index bubble
            }}>
                {rec.method}
            </Typography>

            <Typography sx={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 500, fontSize: '0.9rem',
                color: G.mid, lineHeight: 1.68, flexGrow: 1, mb: 2.5,
            }}>
                {rec.description}
            </Typography>

            <Divider sx={{ borderColor: G.border, mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: '0.68rem', color: G.mid, mb: 0.3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Bias Impact
                    </Typography>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '0.88rem', color: G.green }}>
                        {rec.impact_on_bias}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: '0.68rem', color: G.mid, mb: 0.3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Accuracy Impact
                    </Typography>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '0.88rem', color: G.dark }}>
                        {rec.impact_on_accuracy}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

// ─── Results comparison table ───────────────────────────────────────────────────
function ResultsTable({ fixResult, onDownload }) {
    const biasImprovement = (Number(fixResult?.improvement?.bias_reduction || 0) * 100).toFixed(1);
    const accuracyChange  = Number(fixResult?.improvement?.accuracy_change || 0);
    const accPositive     = accuracyChange >= 0;

    const rows = [
        {
            metric:  'Bias (DPD)',
            before:  Number(fixResult?.before?.demographic_parity_difference || 0).toFixed(4),
            after:   Number(fixResult?.after?.demographic_parity_difference || 0).toFixed(4),
            afterColor: G.green,
            badge:   `↓ ${Math.abs(biasImprovement)}% reduced`,
            badgeBg: `${G.green}10`,
            badgeColor: G.green,
        },
        {
            metric:  'Accuracy',
            before:  `${(Number(fixResult?.before?.accuracy || 0) * 100).toFixed(1)}%`,
            after:   `${(Number(fixResult?.after?.accuracy || 0) * 100).toFixed(1)}%`,
            afterColor: G.dark,
            badge:   `${accPositive ? '+' : ''}${(accuracyChange * 100).toFixed(1)}%`,
            badgeBg: accPositive ? `${G.green}10` : `${G.red}10`,
            badgeColor: accPositive ? G.green : G.red,
        },
    ];

    return (
        <Box sx={{ ...card({ overflow: 'hidden' }) }}>
            {/* Header */}
            <Box sx={{ p: { xs: 2.5, md: 3 }, borderBottom: `1px solid ${G.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', background: `${G.green}10` }}>
                        <CheckCircleIcon sx={{ color: G.green, fontSize: 22 }} />
                    </Box>
                    <Typography sx={{
                        fontFamily: "'Syne',sans-serif", fontWeight: 900,
                        fontSize: '1.05rem', color: G.dark,
                    }}>
                        Mitigation Results
                    </Typography>
                </Box>
            </Box>

            {/* Table */}
            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ background: G.light }}>
                        {['Metric', 'Before', 'After', 'Change'].map((h, i) => (
                            <th key={i} style={{
                                padding: '11px 20px',
                                textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                fontWeight: 700, fontSize: '0.72rem',
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                                color: G.mid, borderBottom: `1px solid ${G.border}`,
                            }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${G.border}` : 'none' }}>
                            <td style={{ padding: '18px 20px', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.95rem', color: G.dark }}>
                                {row.metric}
                            </td>
                            <td style={{ padding: '18px 20px', textAlign: 'center', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: '0.95rem', color: G.mid }}>
                                {row.before}
                            </td>
                            <td style={{ padding: '18px 20px', textAlign: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', color: row.afterColor }}>
                                {row.after}
                            </td>
                            <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                                <Box sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.6,
                                    px: 1.6, py: 0.55, borderRadius: 100,
                                    background: row.badgeBg,
                                }}>
                                    {row.badgeColor === G.green
                                        ? <TrendingUpIcon sx={{ fontSize: 14, color: row.badgeColor }} />
                                        : <TrendingDownIcon sx={{ fontSize: 14, color: row.badgeColor }} />
                                    }
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                                        fontWeight: 800, fontSize: '0.78rem', color: row.badgeColor,
                                    }}>
                                        {row.badge}
                                    </Typography>
                                </Box>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Box>

            {/* Download CTA */}
            <Box sx={{ p: { xs: 2.5, md: 3 }, borderTop: `1px solid ${G.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    startIcon={<CloudDownloadIcon />}
                    onClick={onDownload}
                    sx={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 800, textTransform: 'none',
                        fontSize: '0.92rem',
                        px: 3.5, py: 1.2, borderRadius: '12px',
                        background: `linear-gradient(135deg, ${G.blue}, #1a73e8)`,
                        color: '#fff',
                        boxShadow: `0 6px 20px ${G.blue}30`,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 10px 30px ${G.blue}40`,
                        },
                    }}>
                    Download Mitigated Dataset
                </Button>
            </Box>
        </Box>
    );
}

// ─── Rec card skeleton ─────────────────────────────────────────────────────────
function RecSkeleton() {
    return (
        <Box sx={{ ...card({ p: { xs: 2.5, md: 3.5 }, minHeight: 260 }) }}>
            <Skeleton width="40%" height={22} style={{ marginBottom: 14, borderRadius: 8 }} enableAnimation={true} />
            <Skeleton width="75%" height={28} style={{ marginBottom: 10, borderRadius: 8 }} enableAnimation={true} />
            <Skeleton count={3} height={14} style={{ marginBottom: 6, borderRadius: 6 }} enableAnimation={true} />
            <Skeleton width="60%" height={14} style={{ marginTop: 16, borderRadius: 6 }} enableAnimation={true} />
        </Box>
    );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function Recommendation() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { recommendations } = location.state || {};

    const [fixLoading,   setFixLoading]   = useState(false);
    const [fixResult,    setFixResult]    = useState(null);
    const [activeModel,  setActiveModel]  = useState('');
    const [snackOpen,    setSnackOpen]    = useState(false);
    const [snackMsg,     setSnackMsg]     = useState('');
    const [snackSev,     setSnackSev]     = useState('success');

    const toast = useCallback((msg, sev = 'success') => {
        setSnackMsg(msg); setSnackSev(sev); setSnackOpen(true);
    }, []);

    const handleApplyFix = async (modelName) => {
        setFixLoading(true); setFixResult(null); setActiveModel(modelName);
        try {
            const res = await applyFix(modelName);
            setFixResult(res);
            toast(`Bias mitigation applied using ${modelName.replace('Classifier', '')}!`);
        } catch (err) {
            console.error(err); toast('Failed to apply bias fix.', 'error');
        } finally {
            setFixLoading(false);
        }
    };

    const handleDownloadCSV = async () => {
        try {
            const blob = await downloadFixedDataset();
            const url  = URL.createObjectURL(new Blob([blob]));
            const a    = Object.assign(document.createElement('a'), { href: url, download: 'fixed_dataset.csv' });
            document.body.appendChild(a); a.click(); a.remove();
        } catch (err) {
            console.error(err); toast('CSV download failed.', 'error');
        }
    };

    const MODELS = [
        { id: 'LogisticRegression',      label: 'Logistic Regression',  accent: G.blue   },
        { id: 'RandomForestClassifier',  label: 'Random Forest',        accent: G.green  },
        { id: 'DecisionTreeClassifier',  label: 'Decision Tree',        accent: G.yellow },
    ];

    const recList = recommendations?.recommendations || [];

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
                '@keyframes blobDrift': {
                    '0%,100%': { transform: 'translate(0,0)'         },
                    '50%':     { transform: 'translate(14px,-10px)'  },
                },
                '@keyframes shimmer': {
                    '0%':   { transform: 'translateX(-120%) skewX(-18deg)' },
                    '100%': { transform: 'translateX(320%) skewX(-18deg)'  },
                },
                '@keyframes scanAcross': {
                    '0%':   { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(400%)'  },
                },
                '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
            }} />

            {/* ── Background blobs — transform only ──────────────────────── */}
            <Box aria-hidden="true" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                    { c: '66,133,244', t: '-18%', l: '-12%', s: '52vw', dur: '20s' },
                    { c: '52,168,83',  t: '-2%',  r: '-16%', s: '48vw', dur: '27s', rev: true },
                    { c: '234,67,53',  b: '-20%', l: '4%',   s: '50vw', dur: '23s' },
                    { c: '251,188,5',  b: '-8%',  r: '-4%',  s: '40vw', dur: '18s', rev: true },
                ].map((b, i) => (
                    <Box key={i} sx={{
                        position: 'absolute', width: b.s, height: b.s, borderRadius: '50%',
                        top: b.t, left: b.l, right: b.r, bottom: b.b,
                        background: `radial-gradient(circle, rgba(${b.c},0.14) 0%, rgba(${b.c},0.04) 50%, transparent 70%)`,
                        willChange: 'transform',
                        animation: `blobDrift ${b.dur} ease-in-out infinite ${b.rev ? 'reverse' : ''}`,
                        animationDelay: `${i * -4.5}s`,
                    }} />
                ))}
                <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(248,249,250,0.62)' }} />
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.07) 1.2px, transparent 1.2px)',
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(ellipse 80% 70% at 50% 20%, black 10%, transparent 90%)',
                }} />
            </Box>

            <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, position: 'relative', zIndex: 2 }}>

                {/* ══ PAGE HEADER ════════════════════════════════════════════════ */}
                <motion.div {...fadeUp(0)}>
                    {/* Back button */}
                    <Button
                        startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                        onClick={() => navigate(-1)}
                        sx={{
                            mb: 4, fontFamily: "'Plus Jakarta Sans',sans-serif",
                            fontWeight: 700, textTransform: 'none',
                            color: G.mid, borderRadius: '10px', px: 1.8, py: 0.9,
                            transition: 'background 0.18s, color 0.18s',
                            '&:hover': { background: 'rgba(0,0,0,0.05)', color: G.dark },
                        }}>
                        Back to Analysis
                    </Button>

                    {/* Title block */}
                    <Box sx={{ mb: { xs: 5, md: 7 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.55 }}>
                                {G_COLORS.map((c, i) => (
                                    <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}70` }} />
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
                            fontWeight: 900, fontSize: { xs: '2rem', md: '2.9rem' },
                            letterSpacing: '-0.03em', color: G.dark, lineHeight: 1.1, mb: 1,
                        }}>
                            Mitigation{' '}
                            <Box component="span" sx={{
                                background: `linear-gradient(135deg, ${G.green}, ${G.blue})`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                Strategies
                            </Box>
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            fontWeight: 600, fontSize: '0.95rem', color: G.mid,
                        }}>
                            {recList.length} evidence-based approaches to reduce detected bias in your dataset.
                        </Typography>
                    </Box>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" animate="show">

                    {/* ══ STRATEGY CARDS ═════════════════════════════════════════ */}
                    {recList.length > 0 ? (
                        <>
                            <motion.div variants={child}>
                                <SectionLabel color={G.blue}>Recommended Approaches</SectionLabel>
                            </motion.div>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                gap: 3, mb: 6,
                            }}>
                                {recList.map((rec, idx) => (
                                    <motion.div key={idx} variants={child}>
                                        <RecCard rec={rec} index={idx} />
                                    </motion.div>
                                ))}
                            </Box>
                        </>
                    ) : (
                        <motion.div variants={child}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 6 }}>
                                {[1,2,3,4].map(i => <RecSkeleton key={i} />)}
                            </Box>
                        </motion.div>
                    )}

                    {/* ══ EQUIFIX PIPELINE ══════════════════════════════════════ */}
                    <motion.div variants={child}>
                        <SectionLabel color={G.green}>EquiFix Pipeline</SectionLabel>
                        <Box sx={{
                            ...card({ overflow: 'hidden', position: 'relative', mb: 4 }),
                            // Rainbow top rail
                            '&::before': {
                                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                                borderRadius: '20px 20px 0 0',
                                background: `linear-gradient(90deg,${G.blue},${G.red},${G.yellow},${G.green},${G.blue})`,
                                backgroundSize: '250% 100%',
                                animation: 'gradientRail 4s linear infinite',
                            },
                        }}>
                            <Box sx={{ p: { xs: 3, md: 4 } }}>
                                {/* Panel header */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3.5 }}>
                                    <Box sx={{ p: 1.3, borderRadius: '12px', background: `${G.blue}10`, flexShrink: 0 }}>
                                        <AutoFixHighIcon sx={{ color: G.blue, fontSize: 26 }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{
                                            fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                            fontSize: { xs: '1.12rem', md: '1.28rem' }, color: G.dark, mb: 0.5,
                                        }}>
                                            Automated Bias Mitigation
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                                            fontWeight: 500, fontSize: '0.92rem', color: G.mid, maxWidth: 620,
                                        }}>
                                            Retrain a fair model using Exponentiated Gradient Reduction, balancing accuracy with demographic parity across all groups.
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Model selector */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                                        fontWeight: 700, fontSize: '0.78rem',
                                        color: G.mid, textTransform: 'uppercase',
                                        letterSpacing: '0.08em', mb: 1.8,
                                    }}>
                                        Select a base model
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        {MODELS.map(m => {
                                            const isActive = activeModel === m.id && (fixLoading || fixResult);
                                            return (
                                                <Button
                                                    key={m.id}
                                                    disabled={fixLoading}
                                                    onClick={() => handleApplyFix(m.id)}
                                                    sx={{
                                                        fontFamily: "'Syne',sans-serif",
                                                        fontWeight: 800, textTransform: 'none',
                                                        fontSize: '0.9rem',
                                                        px: 3, py: 1.2, borderRadius: '12px',
                                                        border: `1.5px solid ${isActive ? m.accent : G.border}`,
                                                        color: isActive ? m.accent : G.dark,
                                                        background: isActive ? `${m.accent}0a` : '#fff',
                                                        boxShadow: isActive ? `0 4px 16px ${m.accent}18` : 'none',
                                                        transition: 'all 0.22s ease',
                                                        position: 'relative', overflow: 'hidden',
                                                        '&::after': {
                                                            content: '""', position: 'absolute', inset: 0,
                                                            background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.40) 50%, transparent 70%)',
                                                            transform: 'translateX(-120%) skewX(-18deg)',
                                                        },
                                                        '&:not(:disabled):hover': {
                                                            borderColor: m.accent,
                                                            background: `${m.accent}08`,
                                                            color: m.accent,
                                                            boxShadow: `0 6px 20px ${m.accent}18`,
                                                        },
                                                        '&:not(:disabled):hover::after': {
                                                            animation: 'shimmer 0.5s ease 1',
                                                        },
                                                        '&:disabled': { opacity: 0.5 },
                                                    }}>
                                                    {fixLoading && activeModel === m.id ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{
                                                                width: 14, height: 14, borderRadius: '50%',
                                                                border: `2px solid ${m.accent}40`,
                                                                borderTopColor: m.accent,
                                                                animation: 'spin 0.7s linear infinite',
                                                            }} />
                                                            Running…
                                                        </Box>
                                                    ) : `Fix with ${m.label}`}
                                                </Button>
                                            );
                                        })}
                                    </Box>
                                </Box>

                                {/* Result area */}
                                <AnimatePresence mode="wait">
                                    {fixLoading && (
                                        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {/* Scan bar */}
                                            <Box sx={{ mb: 3, height: 3, borderRadius: 2, background: `${G.blue}12`, overflow: 'hidden', position: 'relative' }}>
                                                <Box sx={{
                                                    position: 'absolute', top: 0, bottom: 0, width: '35%',
                                                    background: `linear-gradient(90deg, transparent, ${G.blue}, ${G.green}, transparent)`,
                                                    borderRadius: 2, animation: 'scanAcross 1.4s ease-in-out infinite',
                                                }} />
                                            </Box>
                                            <Box sx={{ ...card({ p: { xs: 2, md: 3 } }), background: G.light }}>
                                                <Skeleton width={180} height={22} style={{ marginBottom: 20, borderRadius: 8 }} enableAnimation={true} />
                                                {[1,2].map(i => (
                                                    <Box key={i} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 3 }, mb: 2 }}>
                                                        <Skeleton width={120} height={36} style={{ borderRadius: 8 }} enableAnimation={true} />
                                                        <Skeleton width={100} height={36} style={{ borderRadius: 8 }} enableAnimation={true} />
                                                        <Skeleton width={100} height={36} style={{ borderRadius: 8 }} enableAnimation={true} />
                                                        <Skeleton width={100} height={36} style={{ borderRadius: 8 }} enableAnimation={true} />
                                                    </Box>
                                                ))}
                                            </Box>
                                        </motion.div>
                                    )}

                                    {fixResult && !fixLoading && (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
                                            <ResultsTable fixResult={fixResult} onDownload={handleDownloadCSV} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Pre-run hint */}
                                {!fixLoading && !fixResult && (
                                    <Box sx={{
                                        p: 3, borderRadius: '14px',
                                        background: G.light, border: `1px dashed ${G.border}`,
                                        textAlign: 'center',
                                    }}>
                                        <Typography sx={{
                                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                                            fontWeight: 600, fontSize: '0.9rem', color: G.mid,
                                        }}>
                                            Select a model above to apply automated bias mitigation and view before/after comparison.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </motion.div>

                    {/* ══ BOTTOM STATS ROW ═══════════════════════════════════════ */}
                    {recList.length > 0 && (
                        <motion.div variants={child}>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                                gap: 2.5, mt: 2,
                            }}>
                                {[
                                    { label: 'Strategies',      value: recList.length,   color: G.blue   },
                                    { label: 'Categories',      value: [...new Set(recList.map(r => r.category))].length, color: G.green },
                                    { label: 'Base Models',     value: MODELS.length,    color: G.yellow },
                                    { label: 'Mitigation Type', value: 'Auto ML',        color: G.red    },
                                ].map((s, i) => (
                                    <Box key={i} sx={{
                                        ...card({
                                            p: 2.5, textAlign: 'center',
                                            '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 10px 28px ${s.color}14` },
                                        }),
                                        // Thin bottom accent
                                        borderBottom: `3px solid ${s.color}`,
                                    }}>
                                        <Typography sx={{
                                            fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                            fontSize: '1.6rem', color: s.color, lineHeight: 1.1,
                                        }}>
                                            {s.value}
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                                            fontWeight: 600, fontSize: '0.76rem',
                                            color: G.mid, mt: 0.4,
                                        }}>
                                            {s.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </motion.div>
                    )}
                </motion.div>
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
