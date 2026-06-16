import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Snackbar, Alert, GlobalStyles, Chip
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ForestIcon from '@mui/icons-material/Forest';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import DatasetIcon from '@mui/icons-material/Dataset';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { applyFix, downloadFixedDataset } from '../api/equilens';
import ErrorPage from './ErrorPage';
import SEO from '../components/SEO';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';

// ─── Brand Palette ─────────────────────────────────────────────────────────────
const G = {
    blue:    '#4285F4',
    red:     '#EA4335',
    yellow:  '#FBBC05',
    green:   '#34A853',
    dark:    '#202124',
    mid:     '#5F6368',
    light:   '#F8F9FA',
    surface: '#FFFFFF',
    border:  'rgba(0,0,0,0.08)',
};

const G_COLORS = [G.blue, G.red, G.yellow, G.green];

// ─── Elevation levels (Material You) ──────────────────────────────────────────
const ELEV = {
    0: 'none',
    1: '0 1px 2px rgba(0,0,0,0.04), 0 1px 6px rgba(0,0,0,0.04)',
    2: '0 2px 8px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.05)',
    3: '0 4px 16px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)',
    4: '0 8px 28px rgba(0,0,0,0.10), 0 16px 48px rgba(0,0,0,0.08)',
};

// ─── Card factory ──────────────────────────────────────────────────────────────
const card = (extra = {}) => ({
    borderRadius: '20px',
    background: G.surface,
    border: `1px solid ${G.border}`,
    boxShadow: ELEV[1],
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
    ...extra,
});

// ─── Motion presets ────────────────────────────────────────────────────────────
const easeOut = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: easeOut, delay },
});

const stagger = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const child = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

// ─── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '', prefix = '', decimals = 1, color }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const start = 0;
        const end = parseFloat(value);
        if (isNaN(end)) return;
        const duration = 900;
        const startTime = performance.now();

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay((start + (end - start) * eased).toFixed(decimals));
            if (progress < 1) ref.current = requestAnimationFrame(tick);
        };
        ref.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(ref.current);
    }, [value, decimals]);

    return (
        <Typography sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 900,
            fontSize: '1.55rem',
            color: color,
            lineHeight: 1,
            letterSpacing: '-0.02em',
        }}>
            {prefix}{display}{suffix}
        </Typography>
    );
}

// ─── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ w = '100%', h = 18, radius = 8, sx = {} }) {
    return (
        <Box sx={{
            width: w, height: h, borderRadius: `${radius}px`,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 37%, #f0f0f0 63%)',
            backgroundSize: '400% 100%',
            animation: 'shimmerSlide 1.4s ease infinite',
            flexShrink: 0,
            ...sx,
        }} />
    );
}

// ─── Results skeleton — mirrors the real layout ────────────────────────────────
function ResultsSkeleton() {
    return (
        <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
        >
            {/* Scan progress bar */}
            <Box sx={{
                mb: 3, height: 3, borderRadius: 99, overflow: 'hidden',
                background: `${G.blue}12`,
            }}>
                <Box sx={{
                    height: '100%', width: '40%', borderRadius: 99,
                    background: `linear-gradient(90deg, transparent, ${G.blue}, ${G.green}, transparent)`,
                    animation: 'scanBar 1.5s ease-in-out infinite',
                }} />
            </Box>

            {/* Skeleton grid mirrors DatasetDetails + ResultsTable side-by-side */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.5fr' }, gap: 3 }}>
                {/* Left: Config card skeleton */}
                <Box sx={{ ...card({ p: { xs: 2.5, md: 3 } }) }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Shimmer w={38} h={38} radius={10} />
                        <Shimmer w={160} h={20} />
                    </Box>
                    {/* Rows */}
                    {[1,2,3,4,5,6].map(i => (
                        <Box key={i} sx={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', gap: 2,
                            pb: i < 6 ? 1.5 : 0, mb: i < 6 ? 1.5 : 0,
                            borderBottom: i < 6 ? `1px dashed ${G.border}` : 'none',
                        }}>
                            <Shimmer w={`${[90, 80, 130, 70, 145, 100][i-1]}px`} h={13} />
                            <Shimmer w={`${[120, 80, 150, 100, 195, 110][i-1]}px`} h={14} />
                        </Box>
                    ))}
                </Box>

                {/* Right: Results table skeleton */}
                <Box sx={{ ...card({ overflow: 'hidden' }) }}>
                    {/* Header */}
                    <Box sx={{
                        p: { xs: 2.5, md: 3 },
                        borderBottom: `1px solid ${G.border}`,
                        display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                        <Shimmer w={38} h={38} radius={10} />
                        <Shimmer w={180} h={20} />
                    </Box>

                    {/* Table header row */}
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                        gap: 2, px: 3, py: 1.5,
                        background: G.light, borderBottom: `1px solid ${G.border}`,
                    }}>
                        {[70, 50, 50, 80].map((w, i) => (
                            <Shimmer key={i} w={`${w}px`} h={11} sx={{ justifySelf: i === 0 ? 'start' : 'center' }} />
                        ))}
                    </Box>

                    {/* Table rows */}
                    {[0, 1].map(row => (
                        <Box key={row} sx={{
                            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                            gap: 2, px: 3, py: 2.5, alignItems: 'center',
                            borderBottom: row === 0 ? `1px solid ${G.border}` : 'none',
                        }}>
                            <Shimmer w="90px" h={16} />
                            <Shimmer w="60px" h={14} sx={{ justifySelf: 'center' }} />
                            <Shimmer w="60px" h={16} sx={{ justifySelf: 'center' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Shimmer w="80px" h={26} radius={99} />
                            </Box>
                        </Box>
                    ))}

                    {/* Download button area */}
                    <Box sx={{
                        px: 3, py: 2.5, mt: 'auto',
                        borderTop: `1px solid ${G.border}`,
                        display: 'flex', justifyContent: 'flex-end',
                    }}>
                        <Shimmer w={220} h={42} radius={12} />
                    </Box>
                </Box>
            </Box>
        </motion.div>
    );
}

// ─── Metric badge ──────────────────────────────────────────────────────────────
function MetricBadge({ label, value, suffix = '', prefix = '', color, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOut, delay }}
        >
            <Box sx={{
                ...card({ p: 2.5, textAlign: 'center' }),
                borderBottom: `3px solid ${color}`,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `${ELEV[3]}, 0 0 0 1px ${color}18`,
                },
            }}>
                <AnimatedNumber value={value} suffix={suffix} prefix={prefix} color={color} />
                <Typography sx={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600, fontSize: '0.74rem',
                    color: G.mid, mt: 0.6, textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                }}>
                    {label}
                </Typography>
            </Box>
        </motion.div>
    );
}

// ─── Results table ─────────────────────────────────────────────────────────────
function ResultsTable({ fixResult, onDownload }) {
    const getFixVal = (obj, key) => (obj && typeof obj[key] === 'number') ? obj[key] : 0;
    
    const biasImp       = getFixVal(fixResult.improvement, 'bias_reduction');
    const biasPositive  = biasImp >= 0;
    const accChange     = getFixVal(fixResult.improvement, 'accuracy_change');
    const accPositive   = accChange >= 0;
    const f1Change      = getFixVal(fixResult.improvement, 'f1_change');
    const f1Positive    = f1Change >= 0;
    const recallChange  = getFixVal(fixResult.improvement, 'recall_change');
    const recallPositive= recallChange >= 0;

    const rows = [
        {
            metric: 'Bias (DPD)',
            before: getFixVal(fixResult.before, 'demographic_parity_difference').toFixed(4),
            after:  getFixVal(fixResult.after, 'demographic_parity_difference').toFixed(4),
            afterColor: biasPositive ? G.green : G.red,
            badge:  `${biasPositive ? '↓' : '↑'} ${(Math.abs(biasImp) * 100).toFixed(1)}%`,
            badgePositive: biasPositive,
        },
        {
            metric: 'Accuracy',
            before: `${(getFixVal(fixResult.before, 'accuracy') * 100).toFixed(1)}%`,
            after:  `${(getFixVal(fixResult.after, 'accuracy') * 100).toFixed(1)}%`,
            afterColor: accPositive ? G.green : G.red,
            badge:  `${accPositive ? '+' : ''}${(accChange * 100).toFixed(1)}%`,
            badgePositive: accPositive,
        },
        {
            metric: 'F1 Score',
            before: `${(getFixVal(fixResult.before, 'f1_score') * 100).toFixed(1)}%`,
            after:  `${(getFixVal(fixResult.after, 'f1_score') * 100).toFixed(1)}%`,
            afterColor: f1Positive ? G.green : G.red,
            badge:  `${f1Positive ? '+' : ''}${(f1Change * 100).toFixed(1)}%`,
            badgePositive: f1Positive,
        },
        {
            metric: 'Recall',
            before: `${(getFixVal(fixResult.before, 'recall') * 100).toFixed(1)}%`,
            after:  `${(getFixVal(fixResult.after, 'recall') * 100).toFixed(1)}%`,
            afterColor: recallPositive ? G.green : G.red,
            badge:  `${recallPositive ? '+' : ''}${(recallChange * 100).toFixed(1)}%`,
            badgePositive: recallPositive,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.05 }}
            style={{ height: '100%' }}
        >
            <Box sx={{ ...card({ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }) }}>
                {/* Header */}
                <Box sx={{ p: { xs: 2.5, md: 3 }, borderBottom: `1px solid ${G.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            p: 1, borderRadius: '10px',
                            background: `${G.green}12`,
                            display: 'flex', alignItems: 'center',
                        }}>
                            <CheckCircleIcon sx={{ color: G.green, fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography sx={{
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 900, fontSize: '1.05rem', color: G.dark,
                            }}>
                                Mitigation Results
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 500, fontSize: '0.78rem', color: G.mid,
                            }}>
                                Before vs. after comparison
                            </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto', flexShrink: 0 }}>
                            <Chip
                                label="Fairness Applied"
                                size="small"
                                sx={{
                                    background: `${G.green}12`,
                                    color: G.green,
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontWeight: 700, fontSize: '0.7rem',
                                    border: `1px solid ${G.green}30`,
                                }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Table */}
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 480 }}>
                        <thead>
                        <tr style={{ background: G.light }}>
                            {['Metric', 'Before', 'After', 'Change'].map((h, i) => (
                                <th key={i} style={{
                                    padding: '12px 20px',
                                    textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontWeight: 700, fontSize: '0.69rem',
                                    letterSpacing: '0.10em', textTransform: 'uppercase',
                                    color: G.mid, borderBottom: `1px solid ${G.border}`,
                                    width: i === 0 ? '32%' : i === 3 ? '28%' : '20%',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, ease: easeOut, delay: 0.12 + i * 0.08 }}
                                style={{ borderBottom: i < rows.length - 1 ? `1px solid ${G.border}` : 'none' }}
                            >
                                <td style={{ padding: '20px', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.92rem', color: G.dark }}>
                                    {row.metric}
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: G.mid }}>
                                    {row.before}
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: '1rem', color: row.afterColor }}>
                                    {row.after}
                                </td>
                                <td style={{ padding: '20px', textAlign: 'right' }}>
                                    <Box sx={{
                                        display: 'inline-flex', alignItems: 'center', gap: 0.6,
                                        px: 1.4, py: 0.55, borderRadius: '99px',
                                        background: row.badgePositive ? `${G.green}12` : `${G.red}12`,
                                        border: `1px solid ${row.badgePositive ? G.green : G.red}25`,
                                    }}>
                                        {row.badgePositive
                                            ? <TrendingUpIcon sx={{ fontSize: 13, color: G.green }} />
                                            : <TrendingDownIcon sx={{ fontSize: 13, color: G.red }} />
                                        }
                                        <Typography sx={{
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            fontWeight: 800, fontSize: '0.75rem',
                                            color: row.badgePositive ? G.green : G.red,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {row.badge}
                                        </Typography>
                                    </Box>
                                </td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>
                </Box>

                {/* Download */}
                <Box sx={{
                    mt: 'auto', p: { xs: 2.5, md: 3 },
                    borderTop: `1px solid ${G.border}`,
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                            startIcon={<CloudDownloadIcon />}
                            onClick={onDownload}
                            sx={{
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 800, textTransform: 'none', fontSize: '0.9rem',
                                px: 3.5, py: 1.25, borderRadius: '12px',
                                background: `linear-gradient(135deg, ${G.blue} 0%, #1a73e8 100%)`,
                                color: '#fff',
                                boxShadow: `0 4px 16px ${G.blue}35`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, #1a73e8 0%, ${G.blue} 100%)`,
                                    boxShadow: `0 8px 28px ${G.blue}45`,
                                },
                            }}>
                            Download Mitigated Dataset
                        </Button>
                    </motion.div>
                </Box>
            </Box>
        </motion.div>
    );
}

// ─── Dataset details ───────────────────────────────────────────────────────────
function DatasetDetails({ data, results, activeModel, modelLabel, isHistory }) {
    const details = [
        { label: 'Original Dataset',      value: data?.file_name || 'Uploaded File',                  icon: <DatasetIcon sx={{ fontSize: 15 }} /> },
        { label: 'Target Column',          value: results?.target_column || 'N/A',                     icon: <LinearScaleIcon sx={{ fontSize: 15 }} /> },
        { label: 'Protected Attributes',   value: results?.protected_columns?.join(', ') || 'N/A',     icon: <ScatterPlotIcon sx={{ fontSize: 15 }} /> },
        { label: 'Base Model',             value: modelLabel || activeModel,                            icon: <AccountTreeIcon sx={{ fontSize: 15 }} /> },
        { label: 'Mitigation Algorithm',   value: 'Exponentiated Gradient Reduction',                  icon: <AutoFixHighIcon sx={{ fontSize: 15 }} /> },
        { label: 'Fairness Metric',        value: 'Demographic Parity',                                icon: <SettingsInputComponentIcon sx={{ fontSize: 15 }} /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            style={{ height: '100%' }}
        >
            <Box sx={{ ...card({ p: { xs: 2.5, md: 3 }, height: '100%' }) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', background: `${G.blue}12`, display: 'flex', alignItems: 'center' }}>
                        <AutoFixHighIcon sx={{ color: G.blue, fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: '1.05rem', color: G.dark }}>
                            Configuration
                        </Typography>
                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '0.78rem', color: G.mid }}>
                            Run parameters
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {details.map((d, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.32, ease: easeOut, delay: i * 0.05 }}
                        >
                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                gap: { xs: 0.5, sm: 2 },
                                py: 1.6,
                                borderBottom: i < details.length - 1 ? `1px solid ${G.border}` : 'none',
                                minWidth: 0
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: G.mid, flexShrink: 0, minWidth: 0 }}>
                                    {d.icon}
                                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: G.mid, whiteSpace: 'nowrap' }}>
                                        {d.label}
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontWeight: 700, fontSize: '0.84rem', color: G.dark,
                                    textAlign: { xs: 'left', sm: 'right' },
                                    maxWidth: { xs: '100%', sm: '60%' },
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-all',
                                    overflowWrap: 'anywhere'
                                }}>
                                    {d.value}
                                </Typography>
                            </Box>
                        </motion.div>
                    ))}
                </Box>
            </Box>
        </motion.div>
    );
}

// ─── Model selector card ───────────────────────────────────────────────────────
function ModelCard({ model, isActive, isLoading, onSelect, isHistory }) {
    const isRunning = isLoading && isActive;

    const iconMap = {
        RandomForestClassifier: <ForestIcon sx={{ fontSize: 22 }} />,
        DecisionTreeClassifier: <AccountTreeIcon sx={{ fontSize: 22 }} />,
    };

    const descMap = {
        RandomForestClassifier: 'Robust · high accuracy · ensemble',
        DecisionTreeClassifier: 'Visual · explainable · rule-based',
    };

    return (
        <motion.div
            whileHover={!isHistory ? { y: -3 } : {}}
            whileTap={!isHistory ? { scale: 0.98 } : {}}
            style={{ flex: '1 1 160px' }}
        >
            <Box
                onClick={() => !isLoading && !isHistory && onSelect(model.id)}
                sx={{
                    ...card({
                        p: { xs: 2, md: 2.5 },
                        cursor: (isHistory || isLoading) ? 'default' : 'pointer',
                        opacity: isLoading && !isActive ? 0.5 : 1,
                        border: `1.5px solid ${isActive ? model.accent : G.border}`,
                        boxShadow: isActive ? `0 4px 20px ${model.accent}20, ${ELEV[2]}` : ELEV[1],
                        background: isActive ? `${model.accent}06` : G.surface,
                        position: 'relative', overflow: 'hidden',
                    }),
                    '&:hover': (!isLoading && !isHistory) ? {
                        borderColor: model.accent,
                        boxShadow: `0 6px 24px ${model.accent}18, ${ELEV[2]}`,
                    } : {},
                }}
            >
                {/* Active shimmer rail */}
                {isActive && !isRunning && (
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${model.accent}, ${model.accent}80, ${model.accent})`,
                        borderRadius: '20px 20px 0 0',
                    }} />
                )}

                {/* Running scan line */}
                {isRunning && (
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `${model.accent}20`, overflow: 'hidden',
                        borderRadius: '20px 20px 0 0',
                    }}>
                        <Box sx={{
                            position: 'absolute', top: 0, bottom: 0, width: '40%',
                            background: `linear-gradient(90deg, transparent, ${model.accent}, transparent)`,
                            animation: 'scanBar 1.2s ease-in-out infinite',
                        }} />
                    </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{
                        p: 1, borderRadius: '10px', flexShrink: 0,
                        background: isActive ? `${model.accent}15` : `${model.accent}08`,
                        color: model.accent,
                        display: 'flex', alignItems: 'center',
                    }}>
                        {isRunning ? (
                            <Box sx={{
                                width: 22, height: 22, borderRadius: '50%',
                                border: `2.5px solid ${model.accent}30`,
                                borderTopColor: model.accent,
                                animation: 'spin 0.7s linear infinite',
                            }} />
                        ) : iconMap[model.id]}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 800, fontSize: '0.9rem',
                            color: isActive ? model.accent : G.dark,
                            mb: 0.3,
                        }}>
                            {model.label}
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 500, fontSize: '0.73rem',
                            color: G.mid, lineHeight: 1.4,
                        }}>
                            {isRunning ? 'Training…' : descMap[model.id]}
                        </Typography>
                    </Box>
                    {isActive && !isRunning && (
                        <CheckCircleIcon sx={{ color: model.accent, fontSize: 18, flexShrink: 0, mt: 0.2 }} />
                    )}
                </Box>
            </Box>
        </motion.div>
    );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ color = G.blue, children }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Box sx={{ width: 4, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
            <Typography sx={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700, fontSize: '0.7rem',
                letterSpacing: '0.11em', color: G.mid,
                textTransform: 'uppercase',
            }}>
                {children}
            </Typography>
        </Box>
    );
}

// ─── Pre-run empty state ───────────────────────────────────────────────────────
function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            <Box sx={{
                p: { xs: 3, md: 5 }, borderRadius: '16px',
                background: G.light, border: `1.5px dashed ${G.border}`,
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
            }}>
                <Box sx={{
                    width: 48, height: 48, borderRadius: '14px',
                    background: `${G.blue}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <AutoFixHighIcon sx={{ color: G.blue, fontSize: 24 }} />
                </Box>
                <Typography sx={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800, fontSize: '0.98rem', color: G.dark,
                }}>
                    Ready to mitigate
                </Typography>
                <Typography sx={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 500, fontSize: '0.86rem', color: G.mid, maxWidth: 380,
                }}>
                    Pick a base model above to retrain with fairness constraints and see the before/after comparison.
                </Typography>
            </Box>
        </motion.div>
    );
}

// ─── Main component ─────────────────────────────────────────────────────────────
const MODELS = [
    { id: 'RandomForestClassifier',  label: 'Random Forest',       accent: G.green  },
    { id: 'DecisionTreeClassifier',  label: 'Decision Tree',       accent: G.yellow },
];

export default function MigrationDashboard({ injectedState }) {
    const location = useLocation();
    const navigate = useNavigate();

    const state = injectedState || location.state || {};
    const isHistory = !!injectedState?.historyReport;

    const data            = state.data;
    const results         = isHistory ? state.historyReport : state.results;
    
    const [fixLoading, setFixLoading]   = useState(false);
    const [fixResult,  setFixResult]    = useState(isHistory ? state.historyReport.report : null);
    const [activeModel, setActiveModel] = useState(isHistory ? state.historyReport.modelName : '');
    const [snackOpen,  setSnackOpen]    = useState(false);
    const [snackMsg,   setSnackMsg]     = useState('');
    const [snackSev,   setSnackSev]     = useState('success');
    const [errorState, setErrorState]   = useState(null);

    const toast = useCallback((msg, sev = 'success') => {
        setSnackMsg(msg); setSnackSev(sev); setSnackOpen(true);
    }, []);

    const handleApplyFix = async (modelName) => {
        setFixLoading(true); setFixResult(null); setActiveModel(modelName);
        setErrorState(null);

        await requestNotificationPermission();

        try {
            const { objectPath } = data || {};
            const targetColumn   = results?.target_column;
            const protectedCols  = results?.protected_columns;

            if (!objectPath || !targetColumn || !protectedCols) {
                throw new Error('Missing dataset info. Please re-run the audit on the Analysis page first.');
            }
            const res = await applyFix(objectPath, targetColumn, protectedCols, modelName);
            setFixResult(res);
            toast(`Bias mitigated with ${MODELS.find(m => m.id === modelName)?.label || modelName}!`);
            
            sendNotification('Migration Complete', {
                body: 'Bias mitigation has been successfully applied.'
            });
        } catch (err) {
            console.error(err);
            toast(err.message || 'Bias fix failed. Ensure you analysed the dataset first.', 'error');
            
            sendNotification('Migration Failed', {
                body: 'There was an error applying the bias fix.'
            });
        } finally {
            setFixLoading(false);
        }
    };

    const handleDownloadCSV = async () => {
        try {
            if (!fixResult?.mitigated_object_path) {
                throw new Error('No mitigated dataset to download yet.');
            }
            const blob = await downloadFixedDataset(fixResult.mitigated_object_path);
            if (blob) {
                const url = URL.createObjectURL(new Blob([blob]));
                const a   = Object.assign(document.createElement('a'), { href: url, download: 'fixed_dataset.csv' });
                document.body.appendChild(a); a.click(); a.remove();
            }
        } catch (err) {
            console.error(err); toast('CSV download failed.', 'error');
        }
    };

    const bottomStats = [
        { label: 'Pipeline Status', value: fixResult ? 'Done'  : 'Ready',      color: fixResult ? G.green  : G.blue   },
        { label: 'Output Dataset',  value: fixResult ? 'Ready' : 'Pending',    color: fixResult ? G.blue   : G.mid    },
        { label: 'Base Models',     value: MODELS.length,                       color: G.yellow  },
        { label: 'Strategy',        value: 'AutoML',                            color: G.red     },
    ];

    if (errorState) {
        return <ErrorPage code={errorState.code} title={errorState.title} message={errorState.message} />;
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: `linear-gradient(160deg, #eef3ff 0%, ${G.light} 45%, #edfbf2 100%)`,
            pt: { xs: 3, md: 5 }, pb: 16,
            position: 'relative', overflow: 'hidden',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            <SEO title="EquiLens - Migration Dashboard" />
            <GlobalStyles styles={{
                '@keyframes shimmerSlide': {
                    '0%':   { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                '@keyframes scanBar': {
                    '0%':   { transform: 'translateX(-150%)' },
                    '100%': { transform: 'translateX(400%)' },
                },
                '@keyframes blobDrift': {
                    '0%,100%': { transform: 'translate(0, 0)' },
                    '50%':     { transform: 'translate(12px, -8px)' },
                },
                '@keyframes spin': {
                    '100%': { transform: 'rotate(360deg)' },
                },
                '@keyframes gradientRail': {
                    '0%,100%': { backgroundPosition: '0% 50%' },
                    '50%':     { backgroundPosition: '100% 50%' },
                },
            }} />

            {/* ── Background blobs ──────────────────────────────────────────── */}
            <Box aria-hidden="true" sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                    { c: '66,133,244',  t: '-20%', l: '-14%', s: '50vw', dur: '22s' },
                    { c: '52,168,83',   t: '0',    r: '-18%', s: '46vw', dur: '28s', rev: true },
                    { c: '234,67,53',   b: '-22%', l: '6%',   s: '48vw', dur: '25s' },
                    { c: '251,188,5',   b: '-6%',  r: '-6%',  s: '38vw', dur: '19s', rev: true },
                ].map((b, i) => (
                    <Box key={i} sx={{
                        position: 'absolute', width: b.s, height: b.s,
                        top: b.t, left: b.l, right: b.r, bottom: b.b,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(${b.c},0.13) 0%, rgba(${b.c},0.04) 50%, transparent 70%)`,
                        willChange: 'transform',
                        animation: `blobDrift ${b.dur} ease-in-out infinite ${b.rev ? 'reverse' : ''}`,
                        animationDelay: `${i * -5}s`,
                    }} />
                ))}
                <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(248,249,250,0.65)' }} />
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.065) 1.5px, transparent 1.5px)',
                    backgroundSize: '44px 44px',
                    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 15%, black 0%, transparent 100%)',
                }} />
            </Box>

            {/* ── Content ───────────────────────────────────────────────────── */}
            <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 2 }}>

                {/* ── Page header ──────────────────────────────────────────── */}
                <motion.div {...fadeUp(0)}>
                    <Button
                        startIcon={<ArrowBackIcon sx={{ fontSize: 17 }} />}
                        onClick={() => navigate(-1)}
                        sx={{
                            mb: 4, fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 700, textTransform: 'none', fontSize: '0.87rem',
                            color: G.mid, borderRadius: '10px', px: 1.8, py: 0.85,
                            border: `1px solid transparent`,
                            transition: 'all 0.18s ease',
                            '&:hover': {
                                background: 'rgba(0,0,0,0.04)',
                                color: G.dark,
                                border: `1px solid ${G.border}`,
                            },
                        }}>
                        Back to Analysis
                    </Button>

                    <Box sx={{ mb: { xs: 5, md: 7 } }}>
                        {/* Eyebrow */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 0.6 }}>
                                {G_COLORS.map((c, i) => (
                                    <Box key={i} sx={{
                                        width: 7, height: 7, borderRadius: '50%',
                                        background: c, boxShadow: `0 0 5px ${c}60`,
                                    }} />
                                ))}
                            </Box>
                            <Typography sx={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontWeight: 700, fontSize: '0.68rem',
                                letterSpacing: '0.13em', color: G.mid, textTransform: 'uppercase',
                            }}>
                                EquiLens Engine · Bias Mitigation
                            </Typography>
                        </Box>

                        <Typography sx={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 900, fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                            letterSpacing: '-0.03em', color: G.dark, lineHeight: 1.05, mb: 1.5,
                        }}>
                            Migration{' '}
                            <Box component="span" sx={{
                                background: `linear-gradient(135deg, ${G.green} 0%, ${G.blue} 100%)`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                Dashboard
                            </Box>
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 500, fontSize: { xs: '0.9rem', md: '0.97rem' },
                            color: G.mid, maxWidth: 620, lineHeight: 1.65,
                        }}>
                            Retrain a fairer model using Exponentiated Gradient Reduction and generate a bias-mitigated dataset — no code required.
                        </Typography>
                    </Box>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" animate="show">

                    {/* ── EquiFix Pipeline ─────────────────────────────────── */}
                    <motion.div variants={child}>
                        <SectionLabel color={G.green}>EquiFix Pipeline</SectionLabel>
                        <Box sx={{
                            ...card({ overflow: 'hidden', position: 'relative', mb: 4 }),
                            '&::before': {
                                content: '""', position: 'absolute',
                                top: 0, left: 0, right: 0, height: 4,
                                borderRadius: '20px 20px 0 0',
                                background: `linear-gradient(90deg, ${G.blue}, ${G.red}, ${G.yellow}, ${G.green}, ${G.blue})`,
                                backgroundSize: '300% 100%',
                                animation: 'gradientRail 4s linear infinite',
                            },
                        }}>
                            <Box sx={{ p: { xs: 2.5, md: 4 } }}>

                                {/* Panel header */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
                                    <Box sx={{
                                        p: 1.4, borderRadius: '14px',
                                        background: `${G.blue}10`, flexShrink: 0,
                                        display: 'flex', alignItems: 'center',
                                    }}>
                                        <AutoFixHighIcon sx={{ color: G.blue, fontSize: 26 }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{
                                            fontFamily: "'Syne', sans-serif", fontWeight: 900,
                                            fontSize: { xs: '1.1rem', md: '1.28rem' }, color: G.dark, mb: 0.5,
                                        }}>
                                            {isHistory ? 'Mitigation History' : 'Automated Bias Mitigation'}
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            fontWeight: 500, fontSize: '0.9rem', color: G.mid, maxWidth: 600,
                                            lineHeight: 1.6,
                                        }}>
                                            {isHistory ? 'You are viewing a previously executed mitigation.' : 'Retrain with fairness constraints that balance demographic parity across all groups while preserving accuracy.'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Model selector label */}
                                <Typography sx={{
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontWeight: 700, fontSize: '0.74rem',
                                    color: G.mid, textTransform: 'uppercase',
                                    letterSpacing: '0.09em', mb: 2,
                                }}>
                                    {isHistory ? 'Mitigated Model' : 'Choose a base model'}
                                </Typography>

                                {/* Model cards */}
                                <Box sx={{
                                    display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4,
                                    '& > *': { minWidth: { xs: '100%', sm: '160px' } },
                                }}>
                                    {MODELS.map(m => (
                                        <ModelCard
                                            key={m.id}
                                            model={m}
                                            isActive={activeModel === m.id && (fixLoading || !!fixResult)}
                                            isLoading={fixLoading}
                                            onSelect={handleApplyFix}
                                            isHistory={isHistory}
                                        />
                                    ))}
                                </Box>

                                {/* Result area */}
                                <AnimatePresence mode="wait">
                                    {fixLoading && <ResultsSkeleton />}

                                    {fixResult && !fixLoading && (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.38, ease: easeOut }}
                                        >
                                            <Box sx={{
                                                display: 'grid',
                                                gridTemplateColumns: { xs: '1fr', lg: '1fr 1.5fr' },
                                                gap: 3,
                                            }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <DatasetDetails
                                                        data={data}
                                                        results={results}
                                                        activeModel={activeModel}
                                                        modelLabel={MODELS.find(m => m.id === activeModel)?.label}
                                                    />
                                                </Box>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <ResultsTable fixResult={fixResult} onDownload={handleDownloadCSV} />
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    )}

                                    {!fixLoading && !fixResult && <EmptyState />}
                                </AnimatePresence>
                            </Box>
                        </Box>
                    </motion.div>

                    {/* ── Model Insight / Disclaimer ─────────────────────────────────────── */}
                    <motion.div variants={child}>
                        <Box sx={{
                            ...card({ p: { xs: 2.5, md: 3 }, mb: 4, background: `linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)`, borderLeft: `4px solid ${G.yellow}` })
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box sx={{
                                    p: 1.2, borderRadius: '12px', background: `${G.yellow}15`,
                                    display: 'flex', alignItems: 'center', flexShrink: 0
                                }}>
                                    <ForestIcon sx={{ color: G.yellow, fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{
                                        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: G.dark, mb: 0.8
                                    }}>
                                        Model Efficiency & The "No Free Lunch" Theorem
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '0.85rem', color: G.mid, lineHeight: 1.6, mb: 1.5
                                    }}>
                                        No single model works perfectly for every biased dataset. <strong>Logistic Regression</strong> is incredibly fast but assumes the bias is straightforward and linear. If your dataset's bias is complex or highly conditional (e.g., discrimination against older candidates, but <i>only</i> if they are female), non-linear models like <strong>Decision Trees</strong> or <strong>Random Forests</strong> will preserve your predictive accuracy significantly better.
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '0.85rem', color: G.mid, lineHeight: 1.6
                                    }}>
                                        <Box component="span" sx={{ color: G.blue, fontWeight: 700 }}>Pro Tip: </Box> 
                                        <strong>Random Forest</strong> acts as our Gold Standard ensemble algorithm. Thanks to EquiLens' dynamic quantile-binning engine and hard-capped iterations, you can confidently process large datasets (5,000+ rows) seamlessly without exponential efficiency drops!
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </motion.div>

                    {/* ── Processing Time Disclaimer ─────────────────────────────────────── */}
                    <motion.div variants={child}>
                        <Box sx={{
                            ...card({ p: { xs: 2.5, md: 3 }, mb: 4, background: `linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)`, borderLeft: `4px solid ${G.blue}` })
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box sx={{
                                    p: 1.2, borderRadius: '12px', background: `${G.blue}15`,
                                    display: 'flex', alignItems: 'center', flexShrink: 0
                                }}>
                                    <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>⏱️</Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{
                                        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: G.dark, mb: 0.8
                                    }}>
                                        Processing Time Expectation
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '0.85rem', color: G.mid, lineHeight: 1.6, mb: 0.5
                                    }}>
                                        The Bias Audit engine takes up to <strong>1-2 minutes</strong> to Audit the dataset.
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '0.85rem', color: G.mid, lineHeight: 1.6
                                    }}>
                                        The Mitigation ML model takes up to <strong>1 minute</strong> to mitigate / fix the dataset.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </motion.div>

                    {/* ── Bottom stats ─────────────────────────────────────── */}
                    <motion.div variants={child}>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                            gap: { xs: 2, md: 2.5 }, mt: 2,
                        }}>
                            {bottomStats.map((s, i) => (
                                <motion.div
                                    key={s.label}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.38, ease: easeOut, delay: 0.1 + i * 0.06 }}
                                >
                                    <Box sx={{
                                        ...card({
                                            p: { xs: 2, md: 2.5 }, textAlign: 'center',
                                            borderBottom: `3px solid ${s.color}`,
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: `${ELEV[3]}, 0 0 0 1px ${s.color}18`,
                                            },
                                        }),
                                    }}>
                                        <Typography sx={{
                                            fontFamily: "'Syne', sans-serif", fontWeight: 900,
                                            fontSize: { xs: '1.35rem', md: '1.55rem' },
                                            color: s.color, lineHeight: 1.1,
                                        }}>
                                            {s.value}
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            fontWeight: 600, fontSize: '0.72rem',
                                            color: G.mid, mt: 0.5,
                                            textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            {s.label}
                                        </Typography>
                                    </Box>
                                </motion.div>
                            ))}
                        </Box>
                    </motion.div>
                </motion.div>
            </Box>

            {/* ── Snackbar ─────────────────────────────────────────────────── */}
            <Snackbar
                open={snackOpen}
                autoHideDuration={5000}
                onClose={() => setSnackOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackSev}
                    onClose={() => setSnackOpen(false)}
                    sx={{
                        borderRadius: '14px', fontWeight: 700, fontSize: '0.93rem',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                    }}>
                    {snackMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
}