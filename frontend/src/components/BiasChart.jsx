import { useMemo, memo, useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, CartesianGrid, ReferenceLine, LabelList
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Brand palette ─────────────────────────────────────────────────────────────
const G = {
    blue:   '#4285F4',
    red:    '#EA4335',
    yellow: '#FBBC05',
    green:  '#34A853',
    dark:   '#202124',
    mid:    '#5F6368',
    light:  '#F8F9FA',
    border: 'rgba(0,0,0,0.07)',
};

// ─── Shimmer skeleton util ─────────────────────────────────────────────────────
function ShimmerBox({ width = '100%', height, borderRadius = 10, sx = {} }) {
    return (
        <Box sx={{
            width, height, borderRadius, flexShrink: 0,
            background: 'linear-gradient(90deg, #f0f2f5 25%, #e4e7eb 50%, #f0f2f5 75%)',
            backgroundSize: '400% 100%',
            animation: 'bc-shimmer 1.6s ease-in-out infinite',
            ...sx,
        }} />
    );
}

// ─── Chart Skeleton ────────────────────────────────────────────────────────────
function ChartSkeleton() {
    const bars = [62, 88, 44, 75, 55, 91, 38];
    return (
        <Box sx={{ width: '100%', height: '100%', p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column' }}>
            {/* Title skeleton */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 4 }}>
                <ShimmerBox width={280} height={22} borderRadius={8} />
                <ShimmerBox width={180} height={14} borderRadius={6} />
            </Box>

            {/* Legend skeleton */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
                {[100, 80].map((w, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShimmerBox width={12} height={12} borderRadius='50%' />
                        <ShimmerBox width={w} height={11} borderRadius={5} />
                    </Box>
                ))}
            </Box>

            {/* Chart area */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: { xs: 1, md: 2 }, px: { xs: 1, md: 2 }, pb: 3, position: 'relative' }}>
                {/* Y-axis ticks */}
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', pr: 1, pb: 3, flexShrink: 0 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <ShimmerBox key={i} width={28} height={10} borderRadius={4} />
                    ))}
                </Box>

                {/* Bars */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: { xs: 1, md: 2 }, height: '100%' }}>
                    {bars.map((h, i) => (
                        <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, justifyContent: 'flex-end', height: '100%' }}>
                            {/* Value label above bar */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <ShimmerBox width={32} height={10} borderRadius={4} />
                            </motion.div>
                            {/* Bar itself */}
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ duration: 0.7, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                                style={{ width: '100%', height: `${h}%`, transformOrigin: 'bottom', borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative' }}
                            >
                                <Box sx={{
                                    width: '100%', height: '100%', borderRadius: '8px 8px 0 0',
                                    background: 'linear-gradient(90deg, #e8eaed 25%, #dde1e7 50%, #e8eaed 75%)',
                                    backgroundSize: '400% 100%',
                                    animation: `bc-shimmer ${1.4 + i * 0.15}s ease-in-out infinite`,
                                }} />
                            </motion.div>
                            {/* X-label */}
                            <ShimmerBox width='80%' height={10} borderRadius={4} />
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Baseline */}
            <Box sx={{ height: 2, background: G.border, borderRadius: 1, ml: '48px', mr: 2 }} />
        </Box>
    );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = memo(({ active, payload, label, average }) => {
    if (!active || !payload?.length) return null;

    const entry      = payload[0].payload;
    const isLowest   = entry.isLowest;
    const isHighest  = entry.isHighest;
    const accent     = isLowest ? G.red : isHighest ? G.green : G.blue;
    const gradient   = isLowest
        ? `linear-gradient(135deg, ${G.red}, #f57c00)`
        : isHighest
            ? `linear-gradient(135deg, ${G.green}, #1a73e8)`
            : `linear-gradient(135deg, ${G.blue}, ${G.green})`;
    const diff       = average != null ? (entry.rate - average).toFixed(1) : null;

    return (
        <Paper elevation={0} sx={{
            p: 0, minWidth: 170, overflow: 'hidden',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${accent}40`,
            borderRadius: '16px',
            boxShadow: `0 12px 40px ${accent}28, 0 2px 8px rgba(0,0,0,0.08)`,
        }}>
            {/* Header stripe */}
            <Box sx={{ height: 4, background: gradient }} />
            <Box sx={{ p: '14px 16px 16px' }}>
                <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: '1rem', color: G.dark, mb: 0.5 }}>
                    {label}
                </Typography>
                {isLowest && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 2, background: `${G.red}14`, mb: 1 }}>
                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.68rem', color: G.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            ⚠ Lowest Group
                        </Typography>
                    </Box>
                )}
                {isHighest && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 2, background: `${G.green}14`, mb: 1 }}>
                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '0.68rem', color: G.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            ✓ Highest Group
                        </Typography>
                    </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
                    <Typography sx={{ fontFamily: "'Syne'", fontWeight: 900, fontSize: '1.8rem', color: accent, lineHeight: 1 }}>
                        {payload[0].value}
                    </Typography>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '0.9rem', color: G.mid }}>%</Typography>
                </Box>
                <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.78rem', color: G.mid, mt: 0.3 }}>
                    Acceptance Rate
                </Typography>
                {diff !== null && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${G.border}` }}>
                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '0.8rem', color: parseFloat(diff) >= 0 ? G.green : G.red }}>
                            {parseFloat(diff) >= 0 ? `+${diff}` : diff}% vs avg
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
});

// ─── Custom Bar Label (value on top) ──────────────────────────────────────────
const CustomBarLabel = (props) => {
    const { x, y, width, value, isLowest, isHighest } = props;
    if (value == null) return null;
    const color = isLowest ? G.red : isHighest ? G.green : G.blue;
    return (
        <text
            x={x + width / 2}
            y={y - 8}
            fill={color}
            textAnchor="middle"
            fontSize={12}
            fontWeight={800}
            fontFamily="'Plus Jakarta Sans', sans-serif"
        >
            {value}%
        </text>
    );
};

// ─── Main BiasChart ────────────────────────────────────────────────────────────
export default function BiasChart({ data, attributeName }) {
    const [ready, setReady] = useState(false);

    // Slight delay so the skeleton shows before chart mounts
    useEffect(() => {
        if (!data || data.length === 0) return;
        const t = setTimeout(() => setReady(true), 380);
        return () => clearTimeout(t);
    }, [data]);

    // Reset when attribute changes so skeleton re-shows
    useEffect(() => { setReady(false); }, [attributeName]);

    const minRate = useMemo(() => {
        if (!data?.length) return 0;
        return Math.min(...data.map(d => d.rate));
    }, [data]);

    const maxRate = useMemo(() => {
        if (!data?.length) return 0;
        return Math.max(...data.map(d => d.rate));
    }, [data]);

    const average = useMemo(() => {
        if (!data?.length) return 0;
        return parseFloat((data.reduce((s, d) => s + d.rate, 0) / data.length).toFixed(1));
    }, [data]);

    const processedData = useMemo(() => {
        if (!data?.length) return [];
        return data.map(d => ({
            ...d,
            isLowest:  d.rate === minRate,
            isHighest: d.rate === maxRate,
        }));
    }, [data, minRate, maxRate]);

    // ── Empty state ──
    if (!data || data.length === 0) {
        return (
            <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 450 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: `${G.blue}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '1.6rem' }}>📊</Typography>
                </Box>
                <Typography sx={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: '1.1rem', color: G.mid }}>
                    No chart data available
                </Typography>
                <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 500, fontSize: '0.85rem', color: `${G.mid}99` }}>
                    Run the audit to visualize group rates
                </Typography>
            </Box>
        );
    }

    return (
        <>
            {/* Inject keyframes once */}
            <style>{`
                @keyframes bc-shimmer {
                    0%   { background-position: -400% 0; }
                    100% { background-position:  400% 0; }
                }
            `}</style>

            <Box sx={{ width: '100%', height: { xs: 350, sm: 400, md: 450 }, position: 'relative' }}>
                <AnimatePresence mode="wait">
                    {!ready ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.25 } }}
                            style={{ position: 'absolute', inset: 0 }}
                        >
                            <ChartSkeleton />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`chart-${attributeName}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
                        >
                            <Box sx={{ width: '100%', height: '100%', p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column' }}>

                                {/* Title */}
                                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                                    <Typography sx={{ fontFamily: "'Syne'", fontWeight: 900, fontSize: { xs: '1rem', md: '1.15rem' }, textAlign: 'center', color: G.dark, mb: 0.5 }}>
                                        Acceptance Rate by{' '}
                                        <Box component="span" sx={{ background: `linear-gradient(135deg, ${G.blue}, ${G.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                            {attributeName}
                                        </Box>
                                        {' '}Group
                                    </Typography>
                                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.78rem', color: G.mid, textAlign: 'center', mb: 2 }}>
                                        Average: <Box component="span" sx={{ color: G.dark, fontWeight: 800 }}>{average}%</Box>
                                    </Typography>
                                </motion.div>

                                {/* Legend */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, md: 3 }, mb: 2, flexWrap: 'wrap' }}>
                                        {[
                                            { color: G.blue,  label: 'Standard Group' },
                                            { color: G.red,   label: 'Lowest Rate ⚠'  },
                                            { color: G.green, label: 'Highest Rate'    },
                                        ].map(({ color, label }) => (
                                            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: '0.75rem', color: G.mid }}>
                                                    {label}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </motion.div>

                                {/* Chart */}
                                <Box sx={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={processedData}
                                            margin={{ top: 28, right: 16, left: -8, bottom: 4 }}
                                            barCategoryGap="28%"
                                        >
                                            <defs>
                                                <linearGradient id="bc-blue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%"   stopColor={G.blue}  stopOpacity={1}   />
                                                    <stop offset="100%" stopColor="#1A73E8" stopOpacity={0.75} />
                                                </linearGradient>
                                                <linearGradient id="bc-red" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%"   stopColor={G.red}   stopOpacity={1}   />
                                                    <stop offset="100%" stopColor="#C5221F" stopOpacity={0.75} />
                                                </linearGradient>
                                                <linearGradient id="bc-green" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%"   stopColor={G.green} stopOpacity={1}   />
                                                    <stop offset="100%" stopColor="#188038" stopOpacity={0.75} />
                                                </linearGradient>
                                                {/* Hover glow filters */}
                                                <filter id="bc-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                </filter>
                                            </defs>

                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.055)" />

                                            {/* Average reference line */}
                                            <ReferenceLine
                                                y={average}
                                                stroke={`${G.mid}55`}
                                                strokeDasharray="6 3"
                                                strokeWidth={1.5}
                                                label={{
                                                    value: `avg ${average}%`,
                                                    fill: G.mid,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    fontFamily: "'Plus Jakarta Sans'",
                                                    position: 'insideTopRight',
                                                    dy: -6,
                                                }}
                                            />

                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12, fontWeight: 700, fill: G.mid, fontFamily: "'Plus Jakarta Sans'" }}
                                                axisLine={{ stroke: G.border, strokeWidth: 1.5 }}
                                                tickLine={false}
                                                dy={8}
                                                minTickGap={10}
                                                interval={0}
                                            />

                                            <YAxis
                                                tickFormatter={v => `${v}%`}
                                                tick={{ fontSize: 11, fontWeight: 600, fill: G.mid, fontFamily: "'Plus Jakarta Sans'" }}
                                                axisLine={false}
                                                tickLine={false}
                                                dx={-4}
                                                width={42}
                                            />

                                            <RechartsTooltip
                                                content={<CustomTooltip average={average} />}
                                                cursor={{ fill: `${G.blue}07`, rx: 8, ry: 8 }}
                                                isAnimationActive={false}
                                                wrapperStyle={{ outline: 'none', zIndex: 10 }}
                                            />

                                            <Bar
                                                dataKey="rate"
                                                radius={[8, 8, 0, 0]}
                                                maxBarSize={72}
                                                isAnimationActive
                                                animationBegin={80}
                                                animationDuration={900}
                                                animationEasing="ease-out"
                                            >
                                                <LabelList
                                                    dataKey="rate"
                                                    content={(props) => {
                                                        const entry = processedData[props.index];
                                                        return (
                                                            <CustomBarLabel
                                                                {...props}
                                                                isLowest={entry?.isLowest}
                                                                isHighest={entry?.isHighest}
                                                            />
                                                        );
                                                    }}
                                                />
                                                {processedData.map((entry, i) => (
                                                    <Cell
                                                        key={`cell-${i}`}
                                                        fill={
                                                            entry.isLowest  ? 'url(#bc-red)'   :
                                                                entry.isHighest ? 'url(#bc-green)'  :
                                                                    'url(#bc-blue)'
                                                        }
                                                        opacity={0.92}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>

                                {/* Footer insight pill */}
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                                        <Box sx={{
                                            display: 'inline-flex', alignItems: 'center', gap: 1.5,
                                            px: 2.5, py: 1, borderRadius: '50px',
                                            background: `linear-gradient(135deg, ${G.red}0c, ${G.blue}0c)`,
                                            border: `1px solid ${G.border}`,
                                        }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: G.red, flexShrink: 0 }} />
                                            <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '0.78rem', color: G.mid }}>
                                                Disparity gap:{' '}
                                                <Box component="span" sx={{ color: (maxRate - minRate) > 20 ? G.red : G.dark, fontWeight: 900 }}>
                                                    {(maxRate - minRate).toFixed(1)}pp
                                                </Box>
                                                {' '}between highest and lowest groups
                                            </Typography>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </>
    );
}