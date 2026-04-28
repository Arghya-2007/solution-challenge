import { useMemo, memo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';

// Memoized to prevent re-renders unless payload changes
const CustomTooltip = memo(({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const isLowest = payload[0].payload.isLowest;
    const themeColor = isLowest ? '#EA4335' : '#4285F4';
    const shadowColor = isLowest ? 'rgba(234,67,53,0.25)' : 'rgba(66,133,244,0.25)';
    const headerGradient = isLowest
        ? 'linear-gradient(90deg, #EA4335, #f57c00)'
        : 'linear-gradient(90deg, #4285F4, #34A853)';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                minWidth: 140,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: `2px solid ${themeColor}`,
                borderRadius: 3,
                boxShadow: `0 8px 24px ${shadowColor}`,
                position: 'relative',
                overflow: 'hidden',
                // Hardware-accelerated CSS transition replaces Framer Motion
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                willChange: 'transform'
            }}
        >
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: headerGradient }} />
            <Typography variant="subtitle1" fontWeight="900" color="#202124" gutterBottom>
                {label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(0,0,0,0.7)' }}>
                Acceptance Rate:{' '}
                <strong style={{ color: themeColor, fontSize: '1.1rem' }}>
                    {payload[0].value}%
                </strong>
            </Typography>
        </Paper>
    );
});

export default function BiasChart({ data, attributeName }) {
    const minRate = useMemo(() => {
        if (!data || data.length === 0) return 0;
        return Math.min(...data.map(d => d.rate));
    }, [data]);

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => ({ ...d, isLowest: d.rate === minRate }));
    }, [data, minRate]);

    if (!data || data.length === 0) {
        return (
            <Box p={4} display="flex" justifyContent="center" alignItems="center" height={400}>
                <Typography variant="h6" color="text.secondary" fontWeight="700">No chart data available</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: 450, p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
                <Typography variant="h5" fontWeight="900" align="center" mb={4} sx={{ color: '#202124' }}>
                    Acceptance Rate by <span style={{ color: '#4285F4' }}>{attributeName}</span> Group
                </Typography>
            </motion.div>

            <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <BarChart data={processedData} margin={{ top: 30, right: 30, left: 0, bottom: 10 }}>
                        <defs>
                            <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4285F4" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#1A73E8" stopOpacity={0.8}/>
                            </linearGradient>
                            <linearGradient id="colorAlert" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#EA4335" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#C5221F" stopOpacity={0.8}/>
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.06)" />

                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 14, fontWeight: 700, fill: '#5f6368' }}
                            axisLine={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }}
                            tickLine={false}
                            dy={10}
                            minTickGap={15}
                        />

                        <YAxis
                            tickFormatter={(val) => `${val}%`}
                            tick={{ fontSize: 13, fontWeight: 600, fill: '#5f6368' }}
                            axisLine={false}
                            tickLine={false}
                            dx={-10}
                        />

                        <RechartsTooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(66, 133, 244, 0.05)', rx: 8 }}
                            isAnimationActive={false} // Disable Recharts default easing for smoother custom transitions
                        />

                        <Bar
                            dataKey="rate"
                            isAnimationActive={true}
                            animationBegin={100}
                            animationDuration={1000}
                            animationEasing="ease-out"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={80}
                        >
                            {processedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isLowest ? 'url(#colorAlert)' : 'url(#colorNormal)'}
                                    // Removed SVG drop-shadow filter here to fix render pipeline lag
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
}