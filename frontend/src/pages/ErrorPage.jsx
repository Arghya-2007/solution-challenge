import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Box, Typography, Button, GlobalStyles } from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ─── Google Brand Colors ───────────────────────────────────────────────────────
const G = { blue: '#4285F4', red: '#EA4335', yellow: '#FBBC05', green: '#34A853' };
const G_COLORS = [G.blue, G.red, G.yellow, G.green];

// ─── Per-error theming ────────────────────────────────────────────────────────
const ERROR_THEME = {
    '404': {
        primary:   G.blue,
        secondary: G.green,
        accent:    '#1a56c4',
        label:     'Not Found',
        emoji:     '🔭',
        tagline:   'Lost in the void',
        hint:      'The page drifted out of our galaxy.',
    },
    '500': {
        primary:   G.red,
        secondary: G.yellow,
        accent:    '#b31412',
        label:     'Server Error',
        emoji:     '⚡',
        tagline:   'Something exploded',
        hint:      'Our servers had an unexpected meltdown.',
    },
    '503': {
        primary:   G.yellow,
        secondary: G.blue,
        accent:    '#c49200',
        label:     'Unavailable',
        emoji:     '🛠',
        tagline:   'Under maintenance',
        hint:      'We\'ll be back before you can blink.',
    },
    default: {
        primary:   G.green,
        secondary: G.blue,
        accent:    '#1e7e42',
        label:     'Error',
        emoji:     '🌀',
        tagline:   'Something went wrong',
        hint:      'An unexpected error occurred.',
    },
};

// ─── Device capability — computed once ───────────────────────────────────────
const CAP = typeof window !== 'undefined' ? (() => ({
    isMobile: window.innerWidth < 768,
    isLowEnd: (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4,
    hasHover: window.matchMedia('(hover: hover)').matches,
}))() : { isMobile: false, isLowEnd: false, hasHover: true };

const IS_PERF = CAP.isMobile || CAP.isLowEnd;
const CURSOR  = CAP.hasHover && !IS_PERF;

// ─── Particle canvas ──────────────────────────────────────────────────────────
const ParticleField = memo(function ParticleField({ primary }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (IS_PERF) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        let animId, last = 0;
        const FPS = 1000 / 22;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        const COUNT = 22, DIST = 110, DIST_SQ = DIST * DIST;
        // Mix Google colors weighted toward the primary
        const palette = [primary, primary, G.blue, G.red, G.yellow, G.green];

        const pts = Array.from({ length: COUNT }, (_, i) => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 2 + 0.5,
            color: palette[i % palette.length],
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.35 + 0.1,
            pulse: Math.random() * Math.PI * 2,
        }));

        const tick = now => {
            animId = requestAnimationFrame(tick);
            if (now - last < FPS) return;
            last = now;
            const { width: W, height: H } = canvas;
            ctx.clearRect(0, 0, W, H);
            for (let i = 0; i < COUNT; i++) {
                const p = pts[i];
                p.pulse += 0.013;
                p.x = (p.x + p.vx + W) % W;
                p.y = (p.y + p.vy + H) % H;
                ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                ctx.fill();
            }
            let checks = 0;
            outer: for (let i = 0; i < COUNT; i++) {
                for (let j = i + 1; j < COUNT; j++) {
                    if (++checks > 35) break outer;
                    const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < DIST_SQ) {
                        ctx.globalAlpha = (1 - Math.sqrt(dSq) / DIST) * 0.13;
                        ctx.strokeStyle = pts[i].color;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
        };

        animId = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, [primary]);

    if (IS_PERF) return null;
    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.45 }} />;
});

// ─── Custom cursor ────────────────────────────────────────────────────────────
const CustomCursor = memo(function CustomCursor({ primary }) {
    const mx = useMotionValue(-200), my = useMotionValue(-200);
    const sx = useSpring(mx, { stiffness: 500, damping: 30, mass: 0.35 });
    const sy = useSpring(my, { stiffness: 500, damping: 30, mass: 0.35 });
    const tx = useSpring(mx, { stiffness: 70, damping: 14 });
    const ty = useSpring(my, { stiffness: 70, damping: 14 });
    const cx  = useTransform(sx, v => v - 6);
    const cy  = useTransform(sy, v => v - 6);
    const thx = useTransform(tx, v => v - 18);
    const thy = useTransform(ty, v => v - 18);
    const [hov, setHov] = useState(false);
    const [clk, setClk] = useState(false);

    useEffect(() => {
        if (!CURSOR) return;
        const mv = e => { mx.set(e.clientX); my.set(e.clientY); };
        const ov = e => setHov(!!e.target.closest('button,a,[role="button"],[data-hover]'));
        const dn = () => setClk(true);
        const up = () => setClk(false);
        window.addEventListener('mousemove', mv, { passive: true });
        window.addEventListener('mouseover', ov, { passive: true });
        window.addEventListener('mousedown', dn, { passive: true });
        window.addEventListener('mouseup',   up, { passive: true });
        document.body.style.cursor = 'none';
        return () => {
            window.removeEventListener('mousemove', mv);
            window.removeEventListener('mouseover', ov);
            window.removeEventListener('mousedown', dn);
            window.removeEventListener('mouseup',   up);
            document.body.style.cursor = '';
        };
    }, [mx, my]);

    if (!CURSOR) return null;
    return (
        <>
            <motion.div style={{
                position: 'fixed', zIndex: 99997, pointerEvents: 'none',
                left: 0, top: 0, x: thx, y: thy,
                width: 36, height: 36, borderRadius: '50%',
                border: `1px solid ${primary}30`,
                background: `radial-gradient(circle, ${primary}0d, transparent)`,
            }} />
            <motion.div
                animate={{ scale: clk ? 0.65 : 1 }}
                transition={{ duration: 0.1 }}
                style={{
                    position: 'fixed', zIndex: 99999, pointerEvents: 'none',
                    left: 0, top: 0, x: cx, y: cy,
                    width:  hov ? 44 : 12, height: hov ? 44 : 12,
                    borderRadius: '50%',
                    background: hov ? 'transparent' : primary,
                    border:     hov ? `2px solid ${primary}` : 'none',
                    boxShadow:  `0 0 18px ${primary}80, 0 0 36px ${primary}28`,
                    transition: 'width 0.2s, height 0.2s, background 0.2s, border 0.2s',
                }}
            />
        </>
    );
});

// ─── Magnetic Button ──────────────────────────────────────────────────────────
function MagneticBtn({ children, strength = 0.3 }) {
    const ref = useRef(null);
    const x   = useMotionValue(0), y = useMotionValue(0);
    const sx  = useSpring(x, { stiffness: 240, damping: 18, mass: 0.55 });
    const sy  = useSpring(y, { stiffness: 240, damping: 18, mass: 0.55 });
    const mv  = useCallback(e => {
        if (IS_PERF) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left - r.width  / 2) * strength);
        y.set((e.clientY - r.top  - r.height / 2) * strength);
    }, [x, y, strength]);
    const ml  = useCallback(() => { x.set(0); y.set(0); }, [x, y]);
    return (
        <motion.div ref={ref} onMouseMove={mv} onMouseLeave={ml}
                    style={{ x: sx, y: sy }}>
            {children}
        </motion.div>
    );
}

// ─── Glitch Number — the centerpiece ─────────────────────────────────────────
// Pure CSS glitch: offset colored drop-shadows animated via keyframes.
// No extra DOM layers — just ::before / ::after on the Typography.
function GlitchCode({ code, primary, secondary }) {
    return (
        <Box sx={{
            position: 'relative',
            display: 'inline-block',
            // Breathing 3-D float
            animation: 'codeFloat 4.5s ease-in-out infinite',
            maxWidth: '100vw',
            overflow: 'visible'
        }}>
            {/* Main number */}
            <Typography sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 900,
                fontSize: { xs: 'clamp(4rem, 20vw, 8rem)', sm: '10rem', md: '15rem' },
                lineHeight: 0.88,
                letterSpacing: '-0.06em',
                // Google-colored chromatic aberration via text-shadow
                color: primary,
                textShadow: `
                    0 0 80px ${primary}28,
                    0 0 160px ${primary}10
                `,
                position: 'relative', zIndex: 2,
                userSelect: 'none',
                // Glitch layers via filter + animation
                animation: 'glitchColor 6s ease-in-out infinite',
            }}>
                {code}
            </Typography>

            {/* Chromatic aberration ghost — left offset */}
            <Typography sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 900,
                fontSize: { xs: 'clamp(4rem, 20vw, 8rem)', sm: '10rem', md: '15rem' },
                lineHeight: 0.88,
                letterSpacing: '-0.06em',
                color: secondary,
                position: 'absolute', inset: 0, zIndex: 1,
                opacity: 0.35,
                userSelect: 'none',
                animation: 'glitchLeft 6s ease-in-out infinite',
                pointerEvents: 'none',
            }}>
                {code}
            </Typography>

            {/* Chromatic aberration ghost — right offset */}
            <Typography sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 900,
                fontSize: { xs: 'clamp(4rem, 20vw, 8rem)', sm: '10rem', md: '15rem' },
                lineHeight: 0.88,
                letterSpacing: '-0.06em',
                color: G.yellow,
                position: 'absolute', inset: 0, zIndex: 1,
                opacity: 0.22,
                userSelect: 'none',
                animation: 'glitchRight 6s ease-in-out infinite',
                pointerEvents: 'none',
            }}>
                {code}
            </Typography>
        </Box>
    );
}

// ─── Animated SVG "broken signal" decoration ─────────────────────────────────
function BrokenSignal({ code, primary, secondary }) {
    const icons = {
        '404': (
            // Telescope / search beam
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <motion.circle cx="32" cy="32" r="20" stroke={primary} strokeWidth="3"
                               initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                               transition={{ duration: 1.2, ease: 'easeInOut' }} strokeLinecap="round" />
                <motion.line x1="48" y1="48" x2="65" y2="65" stroke={secondary} strokeWidth="4"
                             initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                             transition={{ duration: 0.6, delay: 1.2 }} strokeLinecap="round" />
                <motion.line x1="50" y1="46" x2="55" y2="41" stroke={G.red} strokeWidth="2.5"
                             initial={{ opacity: 0 }} animate={{ opacity: [0,1,0] }}
                             transition={{ duration: 1.8, repeat: Infinity, delay: 1.6 }} strokeLinecap="round" />
                <motion.circle cx="32" cy="32" r="6" fill={primary}
                               initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                               transition={{ type: 'spring', delay: 1.0, bounce: 0.5 }} />
            </svg>
        ),
        '500': (
            // Broken lightning bolt
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <motion.polyline points="42,8 26,38 38,38 30,64 56,28 42,28 52,8"
                                 stroke={G.yellow} strokeWidth="3.5" fill="none" strokeLinejoin="round" strokeLinecap="round"
                                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                 transition={{ duration: 1.1, ease: 'easeOut' }} />
                <motion.line x1="10" y1="30" x2="20" y2="30" stroke={primary} strokeWidth="2"
                             initial={{ scaleX: 0 }} animate={{ scaleX: [0, 1, 0] }}
                             transition={{ duration: 0.8, repeat: Infinity, delay: 1.5, repeatDelay: 1.2 }}
                             style={{ transformOrigin: 'left' }} strokeLinecap="round" />
                <motion.line x1="52" y1="55" x2="62" y2="55" stroke={secondary} strokeWidth="2"
                             initial={{ scaleX: 0 }} animate={{ scaleX: [0, 1, 0] }}
                             transition={{ duration: 0.8, repeat: Infinity, delay: 1.9, repeatDelay: 1.0 }}
                             style={{ transformOrigin: 'left' }} strokeLinecap="round" />
            </svg>
        ),
        '503': (
            // Spinning wrench
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <motion.path
                    d="M48 12 C56 14 62 22 62 32 C62 38 59 43 54 47 L24 64 C22 65 20 64 20 62 L20 58 C20 56 22 55 24 54 L50 38 C52 36 54 34 54 32 C54 26 50 22 46 21 Z"
                    stroke={primary} strokeWidth="2.8" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }} />
                <motion.circle cx="36" cy="36" r="5" fill={secondary}
                               animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                <motion.circle cx="24" cy="58" r="4" stroke={G.yellow} strokeWidth="2" fill="none"
                               initial={{ scale: 0 }} animate={{ scale: 1 }}
                               transition={{ type: 'spring', delay: 1.1, bounce: 0.45 }} />
            </svg>
        ),
    };

    return (
        <Box sx={{ mb: 2, filter: `drop-shadow(0 0 18px ${primary}70)` }}>
            {icons[code] || (
                <motion.svg width="72" height="72" viewBox="0 0 72 72" fill="none"
                            animate={{ rotate: [0, 8, -8, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                    <motion.circle cx="36" cy="36" r="24" stroke={primary} strokeWidth="3"
                                   initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                   transition={{ duration: 1.2 }} />
                    <motion.circle cx="36" cy="36" r="8" fill={secondary}
                                   animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                </motion.svg>
            )}
        </Box>
    );
}

// ─── Floating debris chips ────────────────────────────────────────────────────
// Small status-code fragments that drift around the page.
const DEBRIS = [
    { text: 'ERR_CONN', x: '8%',  y: '18%', delay: 0    },
    { text: 'NULL_PTR', x: '82%', y: '12%', delay: 0.4  },
    { text: '0x404FF',  x: '6%',  y: '68%', delay: 0.8  },
    { text: 'TIMEOUT',  x: '85%', y: '65%', delay: 1.1  },
    { text: 'REQ_FAIL', x: '14%', y: '84%', delay: 0.6  },
    { text: 'HTTP/2.0', x: '76%', y: '82%', delay: 1.5  },
];

function DebrisChip({ text, x, y, delay, primary }) {
    if (IS_PERF) return null;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
                opacity: { delay: delay + 0.8, duration: 0.5 },
                scale:   { delay: delay + 0.8, duration: 0.5 },
                y:       { delay: delay + 0.8, duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
                position: 'fixed', left: x, top: y,
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.7rem', fontWeight: 700,
                color: `${primary}70`,
                border: `1px solid ${primary}25`,
                background: `${primary}08`,
                padding: '3px 10px',
                borderRadius: 6,
                pointerEvents: 'none',
                zIndex: 1,
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.08em',
            }}>
            {text}
        </motion.div>
    );
}

// ─── Main ErrorPage ───────────────────────────────────────────────────────────
export default function ErrorPage({
                                      code    = '404',
                                      title   = 'Page Not Found',
                                      message = "We can't seem to find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.",
                                  }) {
    const navigate = useNavigate();
    const theme    = ERROR_THEME[code] || { ...ERROR_THEME.default, label: 'Error' };
    const { primary, secondary, accent } = theme;
    const blobsRef = useRef([]);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });

    // Parallax blobs
    useEffect(() => {
        if (IS_PERF) return;
        const OFFS = [{ dx: 22, dy: 14 }, { dx: -18, dy: 10 }, { dx: 14, dy: -20 }];
        let ticking = false;
        const mv = e => {
            mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                blobsRef.current.forEach((el, i) => {
                    if (!el || !OFFS[i]) return;
                    el.style.transform = `translate(${mouseRef.current.x * OFFS[i].dx}px,${mouseRef.current.y * OFFS[i].dy}px)`;
                });
                ticking = false;
            });
        };
        window.addEventListener('mousemove', mv, { passive: true });
        return () => window.removeEventListener('mousemove', mv);
    }, []);

    // Font injection (Space Mono for the debris chips + Syne for headers)
    useEffect(() => {
        const href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap';
        if (!document.querySelector(`link[href="${href}"]`)) {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = href;
            document.head.appendChild(l);
        }
    }, []);

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            background: `
                radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}12 0%, transparent 70%),
                linear-gradient(175deg, #f0f4ff 0%, #fafbff 45%, #f5fff8 100%)
            `,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            <GlobalStyles styles={{
                '*, *::before, *::after': {
                    cursor:     CURSOR ? 'none !important' : undefined,
                    boxSizing: 'border-box',
                },
                // 3-D breathing float for the code block
                '@keyframes codeFloat': {
                    '0%,100%': { transform: 'translateY(0) rotateX(0deg)'   },
                    '50%':     { transform: 'translateY(-18px) rotateX(3deg)' },
                },
                // Chromatic aberration left ghost
                '@keyframes glitchLeft': {
                    '0%,90%,100%': { transform: 'translate(0,0)', opacity: 0.35 },
                    '92%':         { transform: 'translate(-6px, 2px)', opacity: 0.5 },
                    '94%':         { transform: 'translate(0,0)',       opacity: 0.35 },
                    '96%':         { transform: 'translate(-3px,-2px)', opacity: 0.45 },
                    '98%':         { transform: 'translate(0,0)',       opacity: 0.35 },
                },
                // Chromatic aberration right ghost
                '@keyframes glitchRight': {
                    '0%,89%,100%': { transform: 'translate(0,0)', opacity: 0.22 },
                    '91%':         { transform: 'translate(6px, -2px)', opacity: 0.38 },
                    '93%':         { transform: 'translate(0,0)',        opacity: 0.22 },
                    '95%':         { transform: 'translate(4px, 1px)',  opacity: 0.32 },
                    '97%':         { transform: 'translate(0,0)',        opacity: 0.22 },
                },
                // Main code color pulse
                '@keyframes glitchColor': {
                    '0%,89%,100%': { textShadow: `0 0 80px ${primary}28, 0 0 160px ${primary}10` },
                    '91%':         { textShadow: `4px 0 0 ${G.red}60, -4px 0 0 ${G.blue}60, 0 0 80px ${primary}40` },
                    '93%':         { textShadow: `0 0 80px ${primary}28, 0 0 160px ${primary}10` },
                    '95%':         { textShadow: `-3px 0 0 ${G.yellow}50, 3px 0 0 ${G.green}50, 0 0 100px ${primary}45` },
                    '97%':         { textShadow: `0 0 80px ${primary}28, 0 0 160px ${primary}10` },
                },
                // Blob morph
                '@keyframes blobMorph': {
                    '0%':   { borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%' },
                    '33%':  { borderRadius: '46% 54% 38% 62% / 40% 56% 44% 60%' },
                    '66%':  { borderRadius: '38% 62% 54% 46% / 56% 40% 60% 44%' },
                    '100%': { borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%' },
                },
                // CTA shimmer sweep
                '@keyframes shimmerBtn': {
                    '0%':   { transform: 'translateX(-130%) skewX(-20deg)' },
                    '100%': { transform: 'translateX(310%)  skewX(-20deg)' },
                },
                // Scan line
                '@keyframes scanLine': {
                    '0%':   { top: '-2px'  },
                    '100%': { top: '102%'  },
                },
                // Dot pop for the status dots
                '@keyframes dotPop': {
                    '0%,100%': { transform: 'scale(1)', opacity: 0.65 },
                    '50%':     { transform: 'scale(1.8)', opacity: 1  },
                },
                // Number spin-in
                '@keyframes spinIn': {
                    '0%':   { opacity: 0, transform: 'perspective(800px) rotateX(-90deg) scale(0.5)' },
                    '100%': { opacity: 1, transform: 'perspective(800px) rotateX(0deg)   scale(1)'   },
                },
                // Horizontal divider grow
                '@keyframes dividerGrow': {
                    '0%':   { width: '0%',   opacity: 0 },
                    '100%': { width: '100%', opacity: 1 },
                },
                // Gradient flow for CTA
                '@keyframes gradientFlow': {
                    '0%':   { backgroundPosition: '0% 50%'   },
                    '50%':  { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%'   },
                },
                // Float1 for debris chips
                '@keyframes float1': {
                    '0%,100%': { transform: 'translateY(0)'    },
                    '50%':     { transform: 'translateY(-12px)' },
                },
            }} />

            <CustomCursor primary={primary} />
            <ParticleField primary={primary} />

            {/* ── Background Blobs ─────────────────────────────────────────── */}
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {!IS_PERF && [
                    { r: `${parseInt(primary.slice(1,3),16)},${parseInt(primary.slice(3,5),16)},${parseInt(primary.slice(5,7),16)}`, top: '-20%', left: '-14%',           size: '60vw', dur: 18 },
                    { r: `${parseInt(secondary.slice(1,3),16)},${parseInt(secondary.slice(3,5),16)},${parseInt(secondary.slice(5,7),16)}`, top: '10%', right: '-20%', left: 'auto', size: '55vw', dur: 24 },
                    { r: '66,133,244',  top: 'auto', bottom: '-18%', left: '5%',   size: '50vw', dur: 15 },
                ].map((b, i) => (
                    <Box key={i} ref={el => blobsRef.current[i] = el} sx={{
                        position: 'absolute', width: b.size, height: b.size,
                        top: b.top, left: b.left, right: b.right, bottom: b.bottom,
                        background: `radial-gradient(circle, rgba(${b.r},0.2), transparent 70%)`,
                        filter: 'blur(38px)', willChange: 'transform',
                        animation: `blobMorph ${b.dur}s ease-in-out infinite ${i % 2 ? 'reverse' : ''}`,
                    }} />
                ))}
                {/* Frosted layer */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: IS_PERF ? 'rgba(248,250,255,0.97)' : 'rgba(248,250,255,0.65)',
                    backdropFilter: IS_PERF ? 'none' : 'blur(6px)',
                }} />
                {/* Dot grid */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `radial-gradient(circle, ${primary}14 1.2px, transparent 1.2px)`,
                    backgroundSize: '38px 38px',
                    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 15%, transparent 90%)',
                }} />
            </Box>

            {/* ── Floating debris chips ─────────────────────────────────────── */}
            {DEBRIS.map((d, i) => (
                <DebrisChip key={i} {...d} primary={primary} />
            ))}

            {/* ── Scan line — vertical sweep across full page ───────────────── */}
            {!IS_PERF && (
                <Box sx={{
                    position: 'fixed', left: 0, right: 0, height: '1.5px', zIndex: 1,
                    background: `linear-gradient(90deg, transparent, ${primary}55, ${secondary}44, transparent)`,
                    animation: 'scanLine 7s linear infinite',
                    pointerEvents: 'none',
                    boxShadow: `0 0 12px ${primary}50`,
                }} />
            )}

            {/* ── Main content ──────────────────────────────────────────────── */}
            <Box sx={{
                position: 'relative', zIndex: 2,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
                px: { xs: 2, sm: 3, md: 6 }, py: { xs: 4, sm: 6, md: 4 },
                width: '100%', maxWidth: 760,
                overflow: 'visible'
            }}>

                {/* NEW: Status dots row */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}>
                    <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 1.5,
                        px: 3, py: 1.2, borderRadius: 100, mb: 3,
                        background: `${primary}0a`,
                        border: `1px solid ${primary}25`,
                        boxShadow: `0 0 0 4px ${primary}06, 0 4px 18px ${primary}12`,
                        position: 'relative', overflow: 'hidden',
                        '&::after': {
                            content: '""',
                            position: 'absolute', top: 0, bottom: 0, width: '40%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                            animation: 'shimmerBtn 3s ease-in-out 1.2s 1',
                            animationFillMode: 'both',
                        },
                    }}>
                        {G_COLORS.map((c, i) => (
                            <Box key={i} sx={{
                                width: { xs: 5, sm: 7 }, height: { xs: 5, sm: 7 }, borderRadius: '50%', background: c,
                                animation: `dotPop 1.4s ease-in-out ${i * 0.22}s infinite`,
                                boxShadow: `0 0 7px ${c}`,
                            }} />
                        ))}
                        <Typography sx={{
                            fontFamily: "'Space Mono', monospace",
                            fontWeight: 700, fontSize: { xs: '0.65rem', sm: '0.76rem' },
                            color: primary, letterSpacing: { xs: '0.05em', sm: '0.1em' },
                        }}>
                            HTTP {code} · {theme.label}
                        </Typography>
                    </Box>
                </motion.div>

                {/* Animated SVG icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2, bounce: 0.4 }}>
                    <Box sx={{ mb: -2, transform: { xs: 'scale(0.8)', sm: 'scale(1)' } }}>
                        <BrokenSignal code={code} primary={primary} secondary={secondary} />
                    </Box>
                </motion.div>

                {/* ── Glitch Error Code ──────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    style={{ animation: 'spinIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.35s both' }}>
                    <GlitchCode code={code} primary={primary} secondary={secondary} />
                </motion.div>

                {/* ── Animated divider ──────────────────────────────────────── */}
                <Box sx={{
                    width: { xs: '90%', md: '72%' }, height: '1.5px', my: 3,
                    position: 'relative', overflow: 'hidden',
                }}>
                    <Box sx={{
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, ${G.yellow}, transparent)`,
                        animation: 'dividerGrow 0.8s ease-out 0.9s both',
                        borderRadius: 2, opacity: 0.55,
                    }} />
                    {/* Travelling dot on divider */}
                    {!IS_PERF && (
                        <motion.div
                            animate={{ x: ['0%', '100%'] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                            style={{
                                position: 'absolute', top: -3, width: 7, height: 7,
                                borderRadius: '50%', background: primary,
                                boxShadow: `0 0 10px ${primary}`,
                            }}
                        />
                    )}
                </Box>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.55 }}>
                    <Typography sx={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 900,
                        fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.5rem' },
                        letterSpacing: '-0.03em',
                        color: '#202124',
                        mb: 0.5,
                        px: { xs: 1, sm: 0 },
                        textShadow: `0 4px 20px ${primary}20`,
                    }}>
                        {title}
                    </Typography>
                    {/* Tagline in brand color */}
                    <Typography sx={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: { xs: '0.7rem', sm: '0.78rem', md: '0.88rem' },
                        color: primary, fontWeight: 700,
                        letterSpacing: { xs: '0.08em', sm: '0.12em' }, mb: 2,
                        opacity: 0.8,
                    }}>
                        {theme.emoji} {theme.tagline.toUpperCase()}
                    </Typography>
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}>
                    <Typography sx={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: { xs: '0.9rem', sm: '0.98rem', md: '1.12rem' },
                        fontWeight: 600,
                        color: 'rgba(32,33,36,0.54)',
                        lineHeight: { xs: 1.5, sm: 1.72 },
                        width: '100%', maxWidth: 540, mx: 'auto', mb: 1, px: { xs: 2, sm: 1 }
                    }}>
                        {message}
                    </Typography>
                    <Typography sx={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: { xs: '0.7rem', sm: '0.78rem' }, color: `${primary}80`, fontWeight: 400,
                        letterSpacing: '0.05em', mt: 1, px: 2
                    }}>
                        {theme.hint}
                    </Typography>
                </motion.div>

                {/* ── CTA buttons ───────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                    style={{ marginTop: 36, display: 'flex', gap: 16, flexDirection: window.innerWidth < 400 ? 'column' : 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%', padding: '0 16px' }}>

                    {/* Primary: gradient CTA with shimmer */}
                    <MagneticBtn>
                        <Button
                            variant="contained"
                            size="large"
                            data-hover="true"
                            onClick={() => navigate('/')}
                            sx={{
                                borderRadius: '50px',
                                textTransform: 'none',
                                px: { xs: 3, sm: 4, md: 5 }, py: { xs: 1.2, sm: 1.6 },
                                width: { xs: '100%', sm: 'auto' },
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 900, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                                background: `linear-gradient(90deg, ${primary}, ${secondary}, ${G.yellow}, ${accent}, ${primary})`,
                                backgroundSize: '300% 100%',
                                animation: IS_PERF ? 'none' : 'gradientFlow 4s ease infinite',
                                color: '#fff', cursor: CURSOR ? 'none' : 'pointer',
                                boxShadow: `0 12px 36px ${primary}40, 0 2px 8px ${primary}1a`,
                                position: 'relative', overflow: 'hidden',
                                '&::after': {
                                    content: '""', position: 'absolute', inset: 0,
                                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
                                    transform: 'translateX(-130%) skewX(-20deg)',
                                },
                                '&:hover': {
                                    boxShadow: `0 18px 48px ${primary}50, 0 0 0 2px rgba(255,255,255,0.2)`,
                                },
                                '&:hover::after': {
                                    animation: 'shimmerBtn 0.55s ease-in-out 1',
                                },
                            }}>
                            ← Back to Homepage
                        </Button>
                    </MagneticBtn>

                    {/* Secondary: ghost reload button */}
                    <MagneticBtn strength={0.15}>
                        <Button
                            variant="outlined"
                            size="large"
                            data-hover="true"
                            onClick={() => window.location.reload()}
                            sx={{
                                borderRadius: '50px',
                                textTransform: 'none',
                                px: { xs: 2.5, sm: 3.5, md: 4.5 }, py: { xs: 1.2, sm: 1.5 },
                                width: { xs: '100%', sm: 'auto' },
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 800, fontSize: { xs: '0.95rem', md: '1rem' },
                                color: primary,
                                border: `1.5px solid ${primary}35`,
                                background: `${primary}07`,
                                cursor: CURSOR ? 'none' : 'pointer',
                                boxShadow: `0 4px 18px ${primary}10`,
                                transition: 'all 0.25s',
                                '&:hover': {
                                    background: `${primary}12`,
                                    border: `1.5px solid ${primary}55`,
                                    boxShadow: `0 8px 28px ${primary}28, 0 0 0 1px ${primary}20`,
                                },
                            }}>
                            ↺ Try Again
                        </Button>
                    </MagneticBtn>
                </motion.div>

                {/* ── Google-colored footer dots ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.6 }}>
                    <Box sx={{
                        display: 'flex', gap: 1.5, mt: 6,
                        alignItems: 'center', justifyContent: 'center',
                        width: '100%', overflow: 'hidden'
                    }}>
                        <Box sx={{ flex: 1, maxWidth: '40px', height: '1px', background: `linear-gradient(90deg, transparent, ${primary}40)` }} />
                        {G_COLORS.map((c, i) => (
                            <Box key={i} sx={{
                                width: 7, height: 7, borderRadius: '50%', background: c,
                                opacity: 0.5, boxShadow: `0 0 8px ${c}`,
                                animation: `dotPop 2s ease-in-out ${i * 0.3}s infinite`,
                            }} />
                        ))}
                        <Box sx={{ flex: 1, maxWidth: '40px', height: '1px', background: `linear-gradient(90deg, ${secondary}40, transparent)` }} />
                    </Box>

                    <Typography sx={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.68rem', color: 'rgba(0,0,0,0.22)',
                        letterSpacing: '0.12em', mt: 2,
                    }}>
                        EQUILENS · {new Date().getFullYear()}
                    </Typography>
                </motion.div>
            </Box>
        </Box>
    );
}

