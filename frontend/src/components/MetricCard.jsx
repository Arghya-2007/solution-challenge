import React, { useEffect, useState } from 'react';
import { Card, Box, Typography, Tooltip, Chip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const AnimatedCounter = ({ value, color }) => {
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { stiffness: 80, damping: 25, restDelta: 0.001 });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        springValue.on("change", (latest) => {
            setDisplayValue(Number(latest).toFixed(2));
        });
    }, [springValue]);

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    return (
        <motion.span
            initial={{ filter: 'blur(10px)', opacity: 0 }}
            animate={{ filter: 'blur(0px)', opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'inline-block',
                textShadow: `0 10px 20px ${color}40`,
                willChange: 'filter, opacity'
            }}
        >
            {displayValue}
        </motion.span>
    );
};

export default function MetricCard({ title, tooltip, value, passed }) {
    const isPass = passed === true || passed === "PASS";
    const activeColor = isPass ? '#34A853' : '#EA4335';
    const gradientDark = isPass ? '#1E8E3E' : '#C5221F';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover="hover"
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ height: '100%', perspective: 1000 }}
        >
            <Card sx={{
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* Animated Hover Aura */}
                <motion.div
                    variants={{
                        hover: { opacity: 1, scale: 1.2, rotate: 15 }
                    }}
                    initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                        position: 'absolute', top: '-20%', right: '-20%', width: '150px', height: '150px',
                        background: `radial-gradient(circle, ${activeColor}30 0%, transparent 70%)`,
                        borderRadius: '50%', zIndex: 0, pointerEvents: 'none'
                    }}
                />

                {/* Dynamic Left Accent Bar */}
                <Box sx={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                    background: `linear-gradient(180deg, ${activeColor}, ${gradientDark})`,
                    boxShadow: `4px 0 15px ${activeColor}50`
                }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, position: 'relative', zIndex: 1 }}>
                    <Typography variant="body1" color="text.secondary" fontWeight="700" sx={{ letterSpacing: '-0.01em' }}>
                        {title}
                    </Typography>
                    <Tooltip
                        title={tooltip}
                        placement="top"
                        slotProps={{
                            tooltip: { sx: { background: 'rgba(32,33,36,0.9)', backdropFilter: 'blur(10px)', borderRadius: 2, fontSize: '0.85rem', fontWeight: 600, py: 1, px: 1.5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' } }
                        }}
                    >
                        <motion.div whileHover={{ rotate: 15, scale: 1.2 }}>
                            <InfoOutlinedIcon sx={{ color: activeColor, fontSize: 22, cursor: 'help', filter: `drop-shadow(0 2px 4px ${activeColor}40)` }} />
                        </motion.div>
                    </Tooltip>
                </Box>

                <Box sx={{ my: 2, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                    <Typography variant="h2" fontWeight="900" sx={{ color: '#202124', letterSpacing: '-0.03em' }}>
                        <AnimatedCounter value={Number(value) || 0} color={activeColor} />
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Chip
                            label={isPass ? 'PASS ✓' : 'FAIL ✗'}
                            sx={{
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                borderRadius: '8px',
                                px: 1,
                                py: 2,
                                background: isPass ? 'rgba(52, 168, 83, 0.15)' : 'rgba(234, 67, 53, 0.15)',
                                color: activeColor,
                                border: `1px solid ${activeColor}40`,
                                boxShadow: `0 4px 10px ${activeColor}20`,
                                transition: 'all 0.3s',
                                '&:hover': { background: isPass ? 'rgba(52, 168, 83, 0.25)' : 'rgba(234, 67, 53, 0.25)', boxShadow: `0 6px 15px ${activeColor}40` }
                            }}
                        />
                    </motion.div>
                </Box>
            </Card>
        </motion.div>
    );
}