import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
    Box, Container, Card, Typography, TextField, Button,
    InputAdornment, Snackbar, Alert, GlobalStyles
} from '@mui/material';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { uploadFile, uploadGoogleSheet } from '../api/equilens';
import Skeleton from 'react-loading-skeleton';

// ─── Brand Colors ──────────────────────────────────────────────────────────────
const G = { blue: '#4285F4', red: '#EA4335', yellow: '#FBBC05', green: '#34A853' };
const G_COLORS = [G.blue, G.red, G.yellow, G.green];

// ─── Device capability — computed ONCE at module load ─────────────────────────
const CAP = typeof window !== 'undefined' ? (() => {
    const n = navigator;
    return {
        isMobile: window.innerWidth < 768,
        isLowEnd: (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4,
        hasHover: window.matchMedia('(hover: hover)').matches,
    };
})() : { isMobile: false, isLowEnd: false, hasHover: true };

const IS_PERF_MODE = CAP.isMobile || CAP.isLowEnd;
const SHOW_CURSOR  = CAP.hasHover && !IS_PERF_MODE;

// ─── Static data ───────────────────────────────────────────────────────────────
const HEADLINE = [
    { text: 'Catch',    color: G.blue    },
    { text: 'bias',     color: G.red     },
    { text: 'before',   color: G.yellow  },
    { text: 'it',       color: '#202124' },
    { text: 'catches',  color: '#202124' },
    { text: 'someone.', color: G.green   },
];

const TEMPLATES = [
    { id: 'hiring',     icon: <WorkIcon fontSize="large" sx={{ color: G.blue }} />,          title: 'Hiring & Recruitment', subtext: 'Detects gender & caste bias in shortlisting',       color: G.blue  },
    { id: 'loan',       icon: <AccountBalanceIcon fontSize="large" sx={{ color: G.red }} />, title: 'Loans Approvals',       subtext: 'Detects religion & income bias in credit decisions', color: G.red   },
    { id: 'admissions', icon: <SchoolIcon fontSize="large" sx={{ color: G.green }} />,       title: 'College Admissions',   subtext: 'Detects regional & socioeconomic bias in ranking',   color: G.green },
];

const STATS = [
    { stat: '99.8%', label: 'Accuracy',   color: G.blue   },
    { stat: '<3s',   label: 'Audit Time', color: G.red    },
    { stat: '12+',   label: 'Bias Types', color: G.yellow },
    { stat: 'SOC2',  label: 'Certified',  color: G.green  },
];

const FLOAT_DOTS = [
    { c: G.blue,   top: '11%',    left: '7%',  s: 16, delay: 0,   dur: 6   },
    { c: G.red,    top: '22%',    right: '9%', s: 12, delay: 1,   dur: 8   },
    { c: G.yellow, top: '60%',    left: '3%',  s: 20, delay: 0.5, dur: 7   },
    { c: G.green,  top: '72%',    right: '5%', s: 15, delay: 1.8, dur: 5.5 },
    { c: G.blue,   bottom: '12%', left: '18%', s: 10, delay: 2.2, dur: 9   },
];

// ─── Particle Canvas ───────────────────────────────────────────────────────────
const ParticleField = memo(function ParticleField() {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (IS_PERF_MODE) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        let animId, lastFrame = 0;
        const FRAME_MS = 1000 / 24;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize, { passive: true });
        const COUNT = 20, DIST = 100, DIST_SQ = DIST * DIST;
        const pts = Array.from({ length: COUNT }, (_, i) => ({
            x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
            r: Math.random() * 1.8 + 0.6, color: G_COLORS[i % 4],
            vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
            alpha: Math.random() * 0.32 + 0.1, pulse: Math.random() * Math.PI * 2,
        }));
        const tick = now => {
            animId = requestAnimationFrame(tick);
            if (now - lastFrame < FRAME_MS) return;
            lastFrame = now;
            const { width: W, height: H } = canvas;
            ctx.clearRect(0, 0, W, H);
            for (let i = 0; i < COUNT; i++) {
                const p = pts[i];
                p.pulse += 0.014;
                p.x = (p.x + p.vx + W) % W;
                p.y = (p.y + p.vy + H) % H;
                ctx.globalAlpha = p.alpha * (0.55 + 0.45 * Math.sin(p.pulse));
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
            }
            let checks = 0;
            outer: for (let i = 0; i < COUNT; i++) {
                for (let j = i + 1; j < COUNT; j++) {
                    if (++checks > 30) break outer;
                    const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < DIST_SQ) {
                        ctx.globalAlpha = (1 - Math.sqrt(dSq) / DIST) * 0.12;
                        ctx.strokeStyle = pts[i].color; ctx.lineWidth = 0.5;
                        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
        };
        animId = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);
    if (IS_PERF_MODE) return null;
    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.38 }} />;
});

// ─── Enhanced Custom Cursor ────────────────────────────────────────────────────
// Trailing halo dot + click-pulse shrink — both transform/opacity only.
const CustomCursor = memo(function CustomCursor() {
    const mx  = useMotionValue(-200), my  = useMotionValue(-200);
    const sx  = useSpring(mx, { stiffness: 520, damping: 30, mass: 0.35 });
    const sy  = useSpring(my, { stiffness: 520, damping: 30, mass: 0.35 });
    const tx  = useSpring(mx, { stiffness: 72, damping: 14 });
    const ty  = useSpring(my, { stiffness: 72, damping: 14 });
    const cx  = useTransform(sx, v => v - 6);
    const cy  = useTransform(sy, v => v - 6);
    const thx = useTransform(tx, v => v - 18);
    const thy = useTransform(ty, v => v - 18);
    const [ci, setCi] = useState(0);
    const [hovering, setHov] = useState(false);
    const [clicking, setClk] = useState(false);

    useEffect(() => {
        if (!SHOW_CURSOR) return;
        const onMove = e => { mx.set(e.clientX); my.set(e.clientY); };
        const onOver = e => setHov(!!e.target.closest('button,a,[role="button"],[data-hover]'));
        const onDown = () => setClk(true);
        const onUp   = () => setClk(false);
        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseover', onOver, { passive: true });
        window.addEventListener('mousedown', onDown, { passive: true });
        window.addEventListener('mouseup',   onUp,   { passive: true });
        const t = setInterval(() => setCi(c => (c + 1) % 4), 900);
        document.body.style.cursor = 'none';
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseover', onOver);
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('mouseup',   onUp);
            clearInterval(t); document.body.style.cursor = '';
        };
    }, [mx, my]);

    if (!SHOW_CURSOR) return null;
    const col = G_COLORS[ci];
    return (
        <>
            {/* Trailing halo */}
            <motion.div style={{
                position: 'fixed', zIndex: 99997, pointerEvents: 'none',
                left: 0, top: 0, x: thx, y: thy,
                width: 36, height: 36, borderRadius: '50%',
                border: `1px solid ${col}28`,
                background: `radial-gradient(circle, ${col}0c, transparent)`,
                transition: 'border-color 0.7s',
            }} />
            {/* Main cursor — shrinks on click */}
            <motion.div
                animate={{ scale: clicking ? 0.68 : 1 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                style={{
                    position: 'fixed', zIndex: 99999, pointerEvents: 'none',
                    left: 0, top: 0, x: cx, y: cy,
                    width:  hovering ? 44 : 12,
                    height: hovering ? 44 : 12,
                    borderRadius: '50%',
                    background: hovering ? 'transparent' : col,
                    border:     hovering ? `2px solid ${col}` : 'none',
                    boxShadow:  `0 0 18px ${col}80, 0 0 36px ${col}28`,
                    transition: 'width 0.2s, height 0.2s, background 0.2s, border 0.2s, box-shadow 0.45s',
                }}
            />
        </>
    );
});

// ─── SpotlightCard ─────────────────────────────────────────────────────────────
// Linear/Vercel-style mouse-tracking inner glow.
// ZERO React re-renders — gradient applied via direct DOM mutation on rAF.
function SpotlightCard({ children, color = G.blue, borderRadius = '28px', sx = {} }) {
    const wrapRef    = useRef(null);
    const overlayRef = useRef(null);

    const onMove = useCallback(e => {
        if (!overlayRef.current || !wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        overlayRef.current.style.background =
            `radial-gradient(320px circle at ${x}px ${y}px, ${color}1C, transparent 65%)`;
        overlayRef.current.style.opacity = '1';
    }, [color]);

    const onLeave = useCallback(() => {
        if (overlayRef.current) overlayRef.current.style.opacity = '0';
    }, []);

    return (
        <Box
            ref={wrapRef}
            onMouseMove={IS_PERF_MODE ? undefined : onMove}
            onMouseLeave={IS_PERF_MODE ? undefined : onLeave}
            sx={{ position: 'relative', borderRadius, height: '100%', ...sx }}>
            <Box ref={overlayRef} sx={{
                position: 'absolute', inset: 0, borderRadius,
                zIndex: 3, pointerEvents: 'none', opacity: 0,
                transition: 'opacity 0.3s ease',
            }} />
            {children}
        </Box>
    );
}

// ─── MagneticBtn ──────────────────────────────────────────────────────────────
// Pulls element toward cursor — pure transform spring, zero paint.
function MagneticBtn({ children, strength = 0.28 }) {
    const ref = useRef(null);
    const x   = useMotionValue(0), y = useMotionValue(0);
    const sx  = useSpring(x, { stiffness: 240, damping: 18, mass: 0.55 });
    const sy  = useSpring(y, { stiffness: 240, damping: 18, mass: 0.55 });

    const onMove  = useCallback(e => {
        if (IS_PERF_MODE) return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left - rect.width  / 2) * strength);
        y.set((e.clientY - rect.top  - rect.height / 2) * strength);
    }, [x, y, strength]);
    const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

    return (
        <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
                    style={{ x: sx, y: sy, width: '100%' }}>
            {children}
        </motion.div>
    );
}

// ─── AnimatedCounter ──────────────────────────────────────────────────────────
// Counts 0 → target when intersecting viewport. Uses rAF + IntersectionObserver.
// No React setState — writes directly to DOM span for zero re-render.
function AnimatedCounter({ value }) {
    const ref     = useRef(null);
    const dispRef = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        if (!ref.current) return;
        const numMatch = value.match(/[\d.]+/);
        if (!numMatch) { if (dispRef.current) dispRef.current.textContent = value; return; }
        const target  = parseFloat(numMatch[0]);
        const prefix  = value.slice(0, value.indexOf(numMatch[0]));
        const suffix  = value.slice(value.indexOf(numMatch[0]) + numMatch[0].length);
        const isFloat = numMatch[0].includes('.');
        const dur     = 1300;

        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || started.current) return;
            started.current = true;
            let startTs = 0;
            const step = ts => {
                if (!startTs) startTs = ts;
                const p     = Math.min((ts - startTs) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                const cur   = eased * target;
                if (dispRef.current)
                    dispRef.current.textContent =
                        prefix + (isFloat ? cur.toFixed(1) : Math.round(cur)) + suffix;
                if (p < 1) requestAnimationFrame(step);
                else if (dispRef.current) dispRef.current.textContent = value;
            };
            requestAnimationFrame(step);
            obs.disconnect();
        }, { threshold: 0.5 });

        obs.observe(ref.current);
        return () => obs.disconnect();
    }, [value]);

    return <span ref={ref}><span ref={dispRef}>0</span></span>;
}

// ─── Animated Check ────────────────────────────────────────────────────────────
const AnimatedCheck = ({ size = 90, color = G.green }) => (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none"
                stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                initial={{ scale: 0, rotate: -120 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.55, duration: 0.7 }}
                style={{ filter: `drop-shadow(0 6px 18px ${color}80)`, marginBottom: 12 }}>
        <motion.circle cx="12" cy="12" r="10"
                       initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
        <motion.polyline points="9 12 11 14 15 10"
                         initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                         transition={{ duration: 0.4, delay: 0.45 }} />
    </motion.svg>
);

// ─── TiltCard ─────────────────────────────────────────────────────────────────
function TiltCard({ children, style }) {
    const ref = useRef(null);
    const rx  = useMotionValue(0), ry = useMotionValue(0);
    const srx = useSpring(rx, { stiffness: 150, damping: 22 });
    const sry = useSpring(ry, { stiffness: 150, damping: 22 });

    const onMove  = useCallback(e => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        rx.set(-(((e.clientY - rect.top)  / rect.height) - 0.5) * 9);
        ry.set( (((e.clientX - rect.left) / rect.width)  - 0.5) * 9);
    }, [rx, ry]);
    const onLeave = useCallback(() => { rx.set(0); ry.set(0); }, [rx, ry]);

    if (IS_PERF_MODE)
        return <div style={{ position: 'relative', height: '100%', ...style }}>{children}</div>;

    return (
        <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
                    style={{
                        rotateX: srx, rotateY: sry,
                        transformStyle: 'preserve-3d', perspective: 1000,
                        position: 'relative', height: '100%', ...style,
                    }}>
            {children}
        </motion.div>
    );
}

// ─── Landing ───────────────────────────────────────────────────────────────────
export default function Landing() {
    const blobsRef     = useRef([]);
    const mouseRef     = useRef({ x: 0.5, y: 0.5 });
    const navigate     = useNavigate();
    const fileInputRef = useRef(null);

    const [file,             setFile]           = useState(null);
    const [isDragging,       setIsDragging]     = useState(false);
    const [sheetUrl,         setSheetUrl]       = useState('');
    const [selectedTemplate, setTemplate]       = useState('');
    const [error,            setError]          = useState('');
    const [isUploading,      setIsUploading]    = useState(false);
    const [uploadProgress,   setUploadProgress] = useState(0);
    const [uploadComplete,   setUploadComplete] = useState(false);
    const [isLoading,        setIsLoading]      = useState(true);

    // Font injection
    useEffect(() => {
        const href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
        if (!document.querySelector(`link[href="${href}"]`)) {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = href;
            document.head.appendChild(l);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 350);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (IS_PERF_MODE) return;
        const OFFSETS = [{ dx: 26, dy: 16 }, { dx: -20, dy: 12 }, { dx: 16, dy: -22 }, { dx: -14, dy: -18 }];
        let ticking = false;
        const onMove = e => {
            mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                blobsRef.current.forEach((el, i) => {
                    if (!el || !OFFSETS[i]) return;
                    el.style.transform = `translate(${mouseRef.current.x * OFFSETS[i].dx}px,${mouseRef.current.y * OFFSETS[i].dy}px)`;
                });
                ticking = false;
            });
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    const runUploadRef = useRef(null);
    useEffect(() => {
        runUploadRef.current = async () => {
            try {
                const res = file ? await uploadFile(file) : await uploadGoogleSheet(sheetUrl);
                setUploadComplete(true);
                setTimeout(() => {
                    setIsUploading(false);
                    setTimeout(() => navigate('/analyze', { state: { data: res, template: selectedTemplate } }), 400);
                }, 1200);
            } catch (err) {
                setIsUploading(false);
                setError(err.message || 'Error uploading dataset.');
            }
        };
    }, [file, sheetUrl, selectedTemplate, navigate]);

    const handleDrop = useCallback(e => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    }, []);

    const handleUploadClick = useCallback(() => {
        if (!file && !sheetUrl) return setError('Please provide a CSV file or Google Sheet URL.');
        setIsUploading(true); setUploadProgress(0); setUploadComplete(false);
        animate(0, 100, {
            duration: 3,
            ease: 'linear',
            onUpdate: (val) => setUploadProgress(val),
            onComplete: () => runUploadRef.current()
        });
    }, [file, sheetUrl]);

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            pt: '80px', pb: 8, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg, #f0f4ff 0%, #fafbff 40%, #f8fff4 100%)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            <GlobalStyles styles={{
                '*, *::before, *::after': {
                    cursor: SHOW_CURSOR ? 'none !important' : undefined,
                    boxSizing: 'border-box',
                },
                '@keyframes gradientFlow': {
                    '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' },
                },
                '@keyframes float1':      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-16px)' } },
                '@keyframes float2':      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
                '@keyframes blobMorph': {
                    '0%':   { borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%' },
                    '33%':  { borderRadius: '46% 54% 38% 62% / 40% 56% 44% 60%' },
                    '66%':  { borderRadius: '38% 62% 54% 46% / 56% 40% 60% 44%' },
                    '100%': { borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%' },
                },
                '@keyframes scanDown':    { '0%': { top: '-5%' }, '100%': { top: '105%' } },
                '@keyframes neonPulse':   { '0%,100%': { opacity: 0.28, transform: 'scale(1)' }, '50%': { opacity: 0.56, transform: 'scale(1.05)' } },
                '@keyframes spinRing':    { '100%': { transform: 'rotate(360deg)' } },
                '@keyframes dotPop':      { '0%,100%': { transform: 'scale(1)', opacity: 0.7 }, '50%': { transform: 'scale(1.75)', opacity: 1 } },
                // Pure-CSS shimmer sweep for CTA — zero JS cost
                '@keyframes shimmerBtn':  { '0%': { transform: 'translateX(-130%) skewX(-20deg)' }, '100%': { transform: 'translateX(310%) skewX(-20deg)' } },
                // Breathing glow for selected template card
                '@keyframes glowBreathe': { '0%,100%': { opacity: 0.25, transform: 'scale(1)' }, '50%': { opacity: 0.5, transform: 'scale(1.07)' } },
                // One-shot horizontal shine for eyebrow pill
                '@keyframes pillShine':   { '0%': { transform: 'translateX(-200%)' }, '100%': { transform: 'translateX(400%)' } },
            }} />

            <CustomCursor />
            <ParticleField />

            {/* ── Background Blobs ─────────────────────────────────────────── */}
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {!IS_PERF_MODE && [
                    { color: '66,133,244',  top: '-18%', left: '-12%',                          size: '55vw', dur: 16 },
                    { color: '234,67,53',   top: '2%',   left: 'auto', right: '-18%',           size: '60vw', dur: 22 },
                    { color: '251,188,5',   top: 'auto', left: '3%',   bottom: '-22%',          size: '58vw', dur: 14 },
                    { color: '52,168,83',   top: 'auto', left: 'auto', right: '-5%', bottom: '-5%', size: '48vw', dur: 19 },
                ].map((b, i) => (
                    <Box key={i} ref={el => blobsRef.current[i] = el} sx={{
                        position: 'absolute', width: b.size, height: b.size,
                        top: b.top, left: b.left, right: b.right, bottom: b.bottom,
                        background: `radial-gradient(circle, rgba(${b.color},0.22), transparent 70%)`,
                        filter: 'blur(35px)', willChange: 'transform',
                        animation: `blobMorph ${b.dur}s ease-in-out infinite ${i % 2 ? 'reverse' : ''}`,
                    }} />
                ))}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: IS_PERF_MODE ? 'rgba(248,250,255,0.97)' : 'rgba(248,250,255,0.68)',
                    backdropFilter: IS_PERF_MODE ? 'none' : 'blur(8px)',
                }} />
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.09) 1.2px, transparent 1.2px)',
                    backgroundSize: '36px 36px',
                    maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 20%, transparent 100%)',
                }} />
            </Box>

            {/* ── Floating Dots ───────────────────────────────────────────── */}
            {!IS_PERF_MODE && FLOAT_DOTS.map((d, i) => (
                <Box key={i} sx={{
                    position: 'fixed', width: d.s, height: d.s, borderRadius: '50%', background: d.c,
                    top: d.top, left: d.left, right: d.right, bottom: d.bottom,
                    zIndex: 1, pointerEvents: 'none',
                    boxShadow: `0 0 ${d.s * 1.5}px ${d.c}65`,
                    animation: `${i % 2 === 0 ? 'float1' : 'float2'} ${d.dur}s ease-in-out ${d.delay}s infinite`,
                    willChange: 'transform',
                }} />
            ))}

            // ─── Drop this entire block in place of the old AnimatePresence upload overlay ──
            // Requires: framer-motion, @mui/material, G / G_COLORS / AnimatedCheck already in scope

            <AnimatePresence>
                {isUploading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(242,246,255,0.97)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 0,
                        }}>

                        {/* ── Central ring system ───────────────────────────────────────── */}
                        <Box sx={{ position: 'relative', width: 220, height: 220, mb: 4, flexShrink: 0 }}>

                            {/* Layer 1 — soft ambient glow (CSS, no JS) */}
                            <Box sx={{
                                position: 'absolute',
                                inset: -28,
                                borderRadius: '50%',
                                background: uploadComplete
                                    ? `radial-gradient(circle, ${G.green}18 0%, transparent 70%)`
                                    : `radial-gradient(circle, ${G.blue}12 0%, transparent 70%)`,
                                transition: 'background 0.6s ease',
                                animation: 'ambientPulse 2.8s ease-in-out infinite',
                            }} />

                            {/* Layer 2 — single shared orbit: 4 dots equally spaced, rotate together */}
                            <motion.div
                                animate={uploadComplete ? { rotate: 0, scale: 0, opacity: 0 } : { rotate: 360 }}
                                transition={uploadComplete
                                    ? { duration: 0.4, ease: 'easeIn' }
                                    : { duration: 3.2, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    position: 'absolute', inset: -18,
                                    width: 'calc(100% + 36px)', height: 'calc(100% + 36px)',
                                }}>
                                {G_COLORS.map((color, i) => {
                                    const angle = (i / 4) * 360; // 0°, 90°, 180°, 270° — perfectly even
                                    const rad   = (angle * Math.PI) / 180;
                                    const r     = 50; // % radius of the orbit container
                                    const cx    = 50 + r * Math.sin(rad);
                                    const cy    = 50 - r * Math.cos(rad);
                                    return (
                                        <Box key={i} sx={{
                                            position: 'absolute',
                                            left:   `${cx}%`, top: `${cy}%`,
                                            transform: 'translate(-50%,-50%)',
                                            width: 11, height: 11, borderRadius: '50%',
                                            background: color,
                                            boxShadow: `0 0 10px ${color}cc, 0 0 20px ${color}55`,
                                        }} />
                                    );
                                })}
                            </motion.div>

                            {/* Layer 3 — dashed guide ring (static, gives the orbit a track) */}
                            <Box sx={{
                                position: 'absolute', inset: -18,
                                width: 'calc(100% + 36px)', height: 'calc(100% + 36px)',
                                borderRadius: '50%',
                                border: '1px dashed rgba(66,133,244,0.12)',
                                pointerEvents: 'none',
                            }} />

                            {/* Layer 4 — progress SVG ring */}
                            <Box sx={{ position: 'absolute', inset: 0 }}>
                                <svg width="100%" height="100%" viewBox="0 0 100 100">
                                    {/* Track */}
                                    <circle
                                        cx="50" cy="50" r="44"
                                        fill="none"
                                        stroke="rgba(0,0,0,0.06)"
                                        strokeWidth="5"
                                    />
                                    {/* Progress arc */}
                                    <motion.circle
                                        cx="50" cy="50" r="44"
                                        fill="none"
                                        stroke={uploadComplete ? G.green : 'url(#uGradNew)'}
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        strokeDasharray="276.5"
                                        initial={{ strokeDashoffset: 276.5 }}
                                        animate={{ strokeDashoffset: 276.5 - (276.5 * uploadProgress) / 100 }}
                                        transition={{ duration: 0, ease: 'linear' }}
                                        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                                    />
                                    {/* Glowing leading dot — moves with progress arc tip */}
                                    {!uploadComplete && uploadProgress > 2 && (
                                        <motion.circle
                                            r="3.5"
                                            fill={G.blue}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0.6, 1, 0.6] }}
                                            transition={{ duration: 1.2, repeat: Infinity }}
                                            style={{
                                                filter: `drop-shadow(0 0 4px ${G.blue})`,
                                                // Position the dot at the arc tip
                                                cx: 50 + 44 * Math.cos(((-90 + (uploadProgress / 100) * 360 - 0.5) * Math.PI) / 180),
                                                cy: 50 + 44 * Math.sin(((-90 + (uploadProgress / 100) * 360 - 0.5) * Math.PI) / 180),
                                            }}
                                        />
                                    )}
                                    <defs>
                                        <linearGradient id="uGradNew" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%"   stopColor={G.blue}   />
                                            <stop offset="33%"  stopColor={G.red}    />
                                            <stop offset="66%"  stopColor={G.yellow} />
                                            <stop offset="100%" stopColor={G.green}  />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </Box>

                            {/* Layer 5 — center content: % counter or check */}
                            <Box sx={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 0.2,
                            }}>
                                <AnimatePresence mode="wait">
                                    {uploadComplete ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', bounce: 0.55, duration: 0.55 }}>
                                            <AnimatedCheck size={58} color={G.green} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="pct"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            style={{ textAlign: 'center' }}>
                                            <Typography sx={{
                                                fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                                fontSize: '2.4rem', lineHeight: 1,
                                                background: `linear-gradient(135deg, ${G.blue}, ${G.red})`,
                                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                            }}>
                                                {Math.round(uploadProgress)}
                                            </Typography>
                                            <Typography sx={{
                                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                                fontWeight: 700, fontSize: '0.72rem',
                                                color: 'rgba(0,0,0,0.30)', letterSpacing: '0.08em',
                                                textTransform: 'uppercase', mt: 0.2,
                                            }}>
                                                percent
                                            </Typography>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Box>
                        </Box>

                        {/* ── Progress bar — thin, underneath the ring ─────────────────── */}
                        <Box sx={{ width: 220, height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.07)', mb: 4, overflow: 'hidden' }}>
                            <motion.div
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ duration: 0, ease: 'linear' }}
                                style={{
                                    height: '100%', borderRadius: 2,
                                    background: uploadComplete
                                        ? G.green
                                        : `linear-gradient(90deg, ${G.blue}, ${G.red}, ${G.yellow}, ${G.green})`,
                                    backgroundSize: '300% 100%',
                                    animation: 'gradientFlow 2.5s linear infinite',
                                }}
                            />
                        </Box>

                        {/* ── Status label ─────────────────────────────────────────────── */}
                        <AnimatePresence mode="wait">
                            {uploadComplete ? (
                                <motion.div
                                    key="done"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ textAlign: 'center' }}>
                                    <Typography sx={{
                                        fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                        fontSize: { xs: '1.5rem', md: '1.9rem' },
                                        letterSpacing: '-0.02em',
                                        background: `linear-gradient(135deg, ${G.green}, #1E8E3E)`,
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    }}>
                                        ✦ Audit Engine Initialized!
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                                        fontWeight: 600, fontSize: '0.9rem',
                                        color: 'rgba(0,0,0,0.36)', mt: 0.8,
                                    }}>
                                        Redirecting to analysis…
                                    </Typography>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.32 }}
                                    style={{ textAlign: 'center' }}>
                                    <Typography sx={{
                                        fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                        fontSize: { xs: '1.4rem', md: '1.8rem' },
                                        letterSpacing: '-0.02em',
                                        background: `linear-gradient(90deg,${G.blue},${G.red},${G.yellow},${G.green},${G.blue})`,
                                        backgroundSize: '300%',
                                        animation: 'gradientFlow 3s ease infinite',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    }}>
                                        Securely Processing Dataset
                                    </Typography>
                                    {/* Animated dot ellipsis */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6, mt: 1 }}>
                                        {[0, 0.18, 0.36].map((d, i) => (
                                            <Box key={i} sx={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: G_COLORS[i],
                                                animation: `dotBounce 1.1s ease-in-out ${d}s infinite`,
                                            }} />
                                        ))}
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Keyframes ────────────────────────────────────────────────── */}
                        <GlobalStyles styles={{
                            '@keyframes ambientPulse': {
                                '0%,100%': { opacity: '0.6', transform: 'scale(1)'     },
                                '50%':     { opacity: '1',   transform: 'scale(1.08)'  },
                            },
                            '@keyframes dotBounce': {
                                '0%,100%': { transform: 'translateY(0)',   opacity: '0.5' },
                                '50%':     { transform: 'translateY(-6px)', opacity: '1'  },
                            },
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, px: { xs: 2, md: 4 }, flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* ══ HERO ══════════════════════════════════════════════════════ */}
                <Box sx={{ textAlign: 'center', mt: { xs: 5, md: 9 }, mb: { xs: 10, md: 14 }, position: 'relative' }}>

                    {/* NEW: Subtle grid overlay — Linear-style depth cue */}
                    {!IS_PERF_MODE && (
                        <Box sx={{
                            position: 'absolute', inset: '-60px -100px', zIndex: 0, pointerEvents: 'none',
                            backgroundImage: `
                                linear-gradient(rgba(66,133,244,0.04) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(66,133,244,0.04) 1px, transparent 1px)
                            `,
                            backgroundSize: '60px 60px',
                            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 85%)',
                        }} />
                    )}

                    {/* Eyebrow pill */}
                    {isLoading ? (
                        <Box sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
                            <Skeleton width={220} height={36} borderRadius={100} />
                        </Box>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
                            {/* NEW: pill with outer glow ring + one-shot shine sweep */}
                            <Box sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 1.5,
                                px: 3, py: 1.3, borderRadius: 100, mb: 5,
                                background: 'rgba(66,133,244,0.07)',
                                border: '1px solid rgba(66,133,244,0.22)',
                                boxShadow: '0 0 0 4px rgba(66,133,244,0.06), 0 4px 20px rgba(66,133,244,0.12)',
                                position: 'relative', overflow: 'hidden', zIndex: 1,
                                // Shine sweep plays once on load
                                '&::after': {
                                    content: '""',
                                    position: 'absolute', top: 0, bottom: 0, width: '35%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                                    animation: 'pillShine 3.2s ease-in-out 0.7s 1',
                                    animationFillMode: 'both',
                                },
                            }}>
                                {G_COLORS.map((c, i) => (
                                    <Box key={i} sx={{
                                        width: 8, height: 8, borderRadius: '50%', background: c,
                                        animation: `dotPop 1.4s ease-in-out ${i * 0.22}s infinite`,
                                        boxShadow: `0 0 7px ${c}`,
                                    }} />
                                ))}
                                <Typography sx={{
                                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                                    fontWeight: 800, fontSize: '0.82rem', color: G.blue, letterSpacing: '0.08em',
                                }}>
                                    AI-POWERED FAIRNESS AUDITING
                                </Typography>
                            </Box>
                        </motion.div>
                    )}

                    {/* Headline */}
                    {isLoading ? (
                        <Box sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
                            <Skeleton width="70%" height={CAP.isMobile ? 60 : 96} borderRadius={16} />
                        </Box>
                    ) : (
                        <Box sx={{
                            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                            gap: { xs: '8px', sm: '12px', md: '18px' }, mb: 5,
                            perspective: 1200, position: 'relative', zIndex: 1,
                        }}>
                            {HEADLINE.map((w, i) => (
                                <motion.span key={i}
                                             initial={IS_PERF_MODE
                                                 ? { opacity: 0, y: 16 }
                                                 : { opacity: 0, y: 70, rotateX: -65, scale: 0.72 }}
                                             animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                                             transition={{ type: 'spring', damping: 14, stiffness: 90, delay: 0.18 + i * 0.09 }}
                                             whileHover={IS_PERF_MODE ? {} : { scale: 1.1, y: -8, transition: { duration: 0.18 } }}
                                             style={{
                                                 fontFamily: "'Syne',sans-serif", color: w.color, fontWeight: 900,
                                                 fontSize: CAP.isMobile ? 'clamp(2rem,10vw,3.2rem)' : 'clamp(2.8rem,6vw,5.2rem)',
                                                 lineHeight: 1.05, display: 'inline-block',
                                                 letterSpacing: '-0.03em',
                                                 textShadow: `0 6px 24px ${w.color}38`,
                                                 willChange: 'transform', position: 'relative', cursor: SHOW_CURSOR ? 'none' : 'auto',
                                             }}>
                                    {w.text}
                                    {/* NEW: underline shimmer — scaleX + opacity on hover, transform only */}
                                    <motion.span
                                        initial={{ opacity: 0, scaleX: 0 }}
                                        whileHover={{ opacity: 1, scaleX: 1 }}
                                        transition={{ duration: 0.22 }}
                                        style={{
                                            position: 'absolute', bottom: -4, left: 0, right: 0, height: 3,
                                            background: `linear-gradient(90deg, transparent, ${w.color}cc, transparent)`,
                                            borderRadius: 2, transformOrigin: 'left', pointerEvents: 'none',
                                        }}
                                    />
                                </motion.span>
                            ))}
                        </Box>
                    )}

                    {/* Sub-headline */}
                    {isLoading ? (
                        <Box sx={{ maxWidth: 660, mx: 'auto', mb: 6 }}>
                            <Skeleton count={2} height={24} style={{ marginBottom: 8 }} />
                        </Box>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78, duration: 0.55 }}>
                            <Typography sx={{
                                maxWidth: 660, mx: 'auto', mb: 6,
                                fontSize: { xs: '1.05rem', md: '1.32rem' }, lineHeight: 1.72,
                                fontWeight: 600, color: 'rgba(32,33,36,0.56)',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                position: 'relative', zIndex: 1,
                            }}>
                                Upload your hiring, loan, or admissions dataset.
                                EquiLens audits it for fairness in seconds using state-of-the-art AI.
                            </Typography>
                        </motion.div>
                    )}

                    {/* ── Stats with AnimatedCounter & glow hover ──────────── */}
                    {isLoading ? (
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            {Array(4).fill(0).map((_, i) => <Skeleton key={i} width={130} height={56} borderRadius={16} inline style={{ margin: '0 6px' }} />)}
                        </Box>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
                            <Box sx={{
                                display: 'flex', gap: { xs: 1.5, md: 2.5 },
                                justifyContent: { xs: 'flex-start', md: 'center' },
                                overflowX: 'auto', pb: 1, px: { xs: 2, md: 0 },
                                position: 'relative', zIndex: 1,
                            }}>
                                {STATS.map((s, i) => (
                                    <motion.div key={i}
                                                whileHover={{ y: -6, scale: 1.06 }}
                                                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                                                style={{ cursor: SHOW_CURSOR ? 'none' : 'auto', flexShrink: 0 }}>
                                        {/* NEW: multi-layer glow on hover */}
                                        <Box sx={{
                                            px: { xs: 2, md: 3 }, py: 1.4, borderRadius: '16px',
                                            background: `linear-gradient(135deg,${s.color}12,${s.color}05)`,
                                            border: `1.5px solid ${s.color}20`,
                                            display: 'flex', alignItems: 'center', gap: 1.2,
                                            boxShadow: `0 4px 14px ${s.color}0e`,
                                            transition: 'box-shadow 0.28s ease, border-color 0.28s ease',
                                            '&:hover': {
                                                boxShadow: `0 8px 28px ${s.color}30, 0 0 0 1px ${s.color}30, inset 0 0 18px ${s.color}07`,
                                                borderColor: `${s.color}40`,
                                            },
                                        }}>
                                            <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: { xs: '1.08rem', md: '1.26rem' }, color: s.color }}>
                                                <AnimatedCounter value={s.stat} />
                                            </Typography>
                                            <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '0.78rem', color: 'rgba(0,0,0,0.42)' }}>
                                                {s.label}
                                            </Typography>
                                        </Box>
                                    </motion.div>
                                ))}
                            </Box>
                        </motion.div>
                    )}
                </Box>

                {/* ══ UPLOAD CARDS ══════════════════════════════════════════════ */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 }, mb: { xs: 14, md: 20 } }}>

                    {/* File Drop Card */}
                    {isLoading ? <Skeleton height={420} borderRadius={28} /> : (
                        <motion.div
                            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ type: 'spring', delay: 1.1, bounce: 0.24 }}
                            style={{ height: '100%' }}>
                            <TiltCard>
                                <Box sx={{
                                    height: '100%', position: 'relative', p: '1.5px', borderRadius: '30px',
                                    overflow: 'hidden', zIndex: 0,
                                    '&::before': {
                                        content: '""', position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                        background: `conic-gradient(from 0deg, ${G.blue}80, ${G.red}80, ${G.yellow}80, ${G.green}80)`,
                                        animation: 'spinRing 5s linear infinite',
                                        filter: 'blur(4px)',
                                        zIndex: -1,
                                    }
                                }}>
                                    <SpotlightCard color={isDragging ? G.blue : file ? G.green : G.blue} sx={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '28px' }}>
                                        <Card
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        elevation={0} data-hover="true"
                                        sx={{
                                            p: { xs: 3, md: 6 }, minHeight: 420,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '28px', cursor: SHOW_CURSOR ? 'none' : 'pointer',
                                            position: 'relative', overflow: 'hidden', height: '100%', zIndex: 0,
                                            background: isDragging ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.90)',
                                            backdropFilter: IS_PERF_MODE ? 'none' : 'blur(10px)',
                                            border: isDragging
                                                ? `2px solid ${G.blue}55`
                                                : file ? `2px solid ${G.green}55` : '1.5px solid rgba(255,255,255,0.9)',
                                            boxShadow: isDragging
                                                ? `0 24px 60px ${G.blue}20, 0 0 0 3px ${G.blue}12`
                                                : '0 16px 48px rgba(0,0,0,0.08)',
                                            transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                                            // NEW: rich layered glow on hover
                                            '&:hover': {
                                                boxShadow: `0 28px 65px rgba(0,0,0,0.10), 0 0 0 1px ${G.blue}16, 0 0 40px ${G.blue}09`,
                                                borderColor: `${G.blue}28`,
                                            },
                                        }}>
                                        <input type="file" hidden ref={fileInputRef} onChange={e => setFile(e.target.files[0])} accept=".csv,.xlsx" />

                                        {isDragging && (
                                            <Box sx={{
                                                position: 'absolute', left: 0, right: 0, height: '2px',
                                                background: `linear-gradient(90deg, transparent, ${G.blue}, ${G.green}, transparent)`,
                                                animation: 'scanDown 1.4s ease-in-out infinite',
                                                zIndex: 5, boxShadow: `0 0 10px ${G.blue}70`,
                                            }} />
                                        )}

                                        {file ? <AnimatedCheck size={100} color={G.green} /> : (
                                            <motion.div
                                                animate={isDragging ? { scale: 1.28, rotate: 8 } : { y: [0, -12, 0] }}
                                                transition={isDragging
                                                    ? { type: 'spring', stiffness: 220 }
                                                    : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
                                                <Box sx={{
                                                    position: 'relative', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', width: 148, height: 148,
                                                }}>
                                                    {[{ s: 130, c: G.blue, d: '9s' }, { s: 162, c: G.green, d: '14s', rev: true }].map((ring, ri) => (
                                                        <Box key={ri} sx={{
                                                            position: 'absolute', width: ring.s, height: ring.s,
                                                            border: `1.5px dashed ${ring.c}36`, borderRadius: '50%',
                                                            animation: `spinRing ${ring.d} linear infinite ${ring.rev ? 'reverse' : ''}`,
                                                            willChange: 'transform',
                                                        }} />
                                                    ))}
                                                    {/* NEW: icon glow halo on drag */}
                                                    <Box sx={{
                                                        position: 'absolute', inset: 0, borderRadius: '50%',
                                                        background: isDragging ? `radial-gradient(circle, ${G.blue}24 0%, transparent 70%)` : 'transparent',
                                                        transition: 'background 0.4s',
                                                    }} />
                                                    <CloudUploadIcon sx={{
                                                        fontSize: 78, position: 'relative', zIndex: 2,
                                                        color: isDragging ? G.blue : 'rgba(0,0,0,0.16)',
                                                        filter: isDragging ? `drop-shadow(0 0 18px ${G.blue}90)` : 'none',
                                                        transition: 'all 0.35s',
                                                    }} />
                                                </Box>
                                            </motion.div>
                                        )}

                                        <Typography sx={{
                                            fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                            fontSize: { xs: '1.42rem', md: '1.82rem' },
                                            mt: 3.5, textAlign: 'center',
                                            color: file ? G.green : '#202124',
                                            textShadow: file ? `0 4px 18px ${G.green}48` : 'none',
                                            letterSpacing: '-0.02em',
                                        }}>
                                            {file ? file.name : (isDragging ? '🎯 Release to Scan!' : 'Drop Dataset Here')}
                                        </Typography>

                                        {!file && (
                                            <>
                                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, color: 'rgba(0,0,0,0.25)', mt: 1 }}>
                                                    or click to browse local files
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                                                    {['.CSV', '.XLSX'].map((fmt, fi) => (
                                                        <Box key={fi} sx={{
                                                            px: 2.2, py: 0.6, borderRadius: 100,
                                                            background: `${G_COLORS[fi * 2]}0d`,
                                                            border: `1.5px solid ${G_COLORS[fi * 2]}20`,
                                                            transition: 'all 0.22s',
                                                            // NEW: badge hover glow
                                                            '&:hover': {
                                                                background: `${G_COLORS[fi * 2]}18`,
                                                                borderColor: `${G_COLORS[fi * 2]}40`,
                                                                boxShadow: `0 0 14px ${G_COLORS[fi * 2]}22`,
                                                            },
                                                        }}>
                                                            <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.78rem', color: G_COLORS[fi * 2] }}>{fmt}</Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </>
                                        )}

                                        {file && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, width: '100%', maxWidth: '320px', position: 'relative', zIndex: 10 }}>
                                                <MagneticBtn>
                                                    <Button variant="contained" fullWidth size="large"
                                                            onClick={e => { e.stopPropagation(); handleUploadClick(); }}
                                                            disabled={!file || isUploading}
                                                            data-hover="true"
                                                            sx={{
                                                                py: 1.6, borderRadius: '50px',
                                                                fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                                                fontSize: '1.1rem', textTransform: 'none',
                                                                background: `linear-gradient(90deg,${G.blue},${G.red},${G.yellow},${G.green},${G.blue})`,
                                                                backgroundSize: '300% 100%',
                                                                animation: IS_PERF_MODE ? 'none' : 'gradientFlow 4s ease infinite',
                                                                color: 'white', cursor: SHOW_CURSOR ? 'none' : 'pointer',
                                                                boxShadow: `0 12px 36px ${G.blue}36, 0 2px 8px ${G.blue}1a`,
                                                                '&:not(:disabled):hover': {
                                                                    boxShadow: `0 18px 48px ${G.blue}48, 0 0 0 2px rgba(255,255,255,0.18)`,
                                                                },
                                                                '&:disabled': { background: '#e0e0e0', color: '#9e9e9e', boxShadow: 'none' },
                                                            }}>
                                                        ✦ Start Audit
                                                    </Button>
                                                </MagneticBtn>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ width: '100%' }}>
                                                    <Button fullWidth size="large" onClick={e => { e.stopPropagation(); setFile(null); }}
                                                            sx={{
                                                                fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                                                borderRadius: '50px', textTransform: 'none',
                                                                background: `linear-gradient(135deg,${G.red},#c5221f)`,
                                                                color: '#fff', py: 1.4,
                                                                boxShadow: `0 8px 22px ${G.red}38`,
                                                                '&:hover': { background: `linear-gradient(135deg,#c5221f,#a50e0e)`, boxShadow: `0 12px 32px ${G.red}55` },
                                                            }}>
                                                        ✕ Remove File
                                                    </Button>
                                                </motion.div>
                                            </Box>
                                        )}
                                    </Card>
                                </SpotlightCard>
                                </Box>
                            </TiltCard>
                        </motion.div>
                    )}

                    {/* Google Sheets Card */}
                    {isLoading ? <Skeleton height={420} borderRadius={28} /> : (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ type: 'spring', delay: 1.28, bounce: 0.24 }}
                            style={{ height: '100%' }}>
                            <TiltCard>
                                <Box sx={{
                                    height: '100%', position: 'relative', p: '1.5px', borderRadius: '30px',
                                    overflow: 'hidden', zIndex: 0,
                                    '&::before': {
                                        content: '""', position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                        background: `conic-gradient(from 0deg, ${G.green}80, ${G.yellow}80, ${G.red}80, ${G.blue}80, ${G.green}80)`,
                                        animation: 'spinRing 5s linear infinite reverse',
                                        filter: 'blur(4px)',
                                        zIndex: -1,
                                    }
                                }}>
                                    <SpotlightCard color={G.green} sx={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '28px' }}>
                                        <Card elevation={0} sx={{
                                        p: { xs: 3, md: 6 }, minHeight: 420,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '28px', position: 'relative', height: '100%',
                                        background: 'rgba(255,255,255,0.92)',
                                        backdropFilter: IS_PERF_MODE ? 'none' : 'blur(10px)',
                                        border: sheetUrl ? `2px solid ${G.green}42` : '1.5px solid rgba(255,255,255,0.9)',
                                        boxShadow: '0 16px 48px rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            boxShadow: `0 28px 65px rgba(0,0,0,0.1), 0 0 0 1px ${G.green}16, 0 0 40px ${G.green}09`,
                                            borderColor: `${G.green}26`,
                                        },
                                    }}>
                                        {/* Sheets icon with pulsing halo */}
                                        <motion.div
                                            animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                                            <Box sx={{ position: 'relative', width: 86, height: 86, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {/* NEW: pulsing halo behind icon */}
                                                <motion.div
                                                    animate={{ scale: [1, 1.28, 1], opacity: [0.18, 0.44, 0.18] }}
                                                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                                                    style={{
                                                        position: 'absolute', inset: -20, borderRadius: '50%',
                                                        background: `radial-gradient(circle,${G.green}40,transparent)`,
                                                    }}
                                                />
                                                <img
                                                    src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png"
                                                    alt="Google Sheets" width={80} height={80} loading="lazy"
                                                    style={{ filter: `drop-shadow(0 10px 18px ${G.green}55)`, position: 'relative', zIndex: 2 }}
                                                />
                                            </Box>
                                        </motion.div>

                                        <Typography sx={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: { xs: '1.42rem', md: '1.82rem' }, mt: 3, mb: 0.5, color: '#202124', letterSpacing: '-0.02em' }}>
                                            Import via Sheets
                                        </Typography>
                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: 'rgba(0,0,0,0.36)', fontWeight: 600, mb: 4, fontSize: '0.94rem' }}>
                                            Connect any public Google Sheet
                                        </Typography>

                                        {/* Gradient-bordered input */}
                                        <Box sx={{ width: '100%', mb: 2.5, position: 'relative' }}>
                                            <Box sx={{
                                                position: 'absolute', inset: -2, borderRadius: '26px', zIndex: 0,
                                                background: sheetUrl
                                                    ? `linear-gradient(90deg,${G.blue},${G.green})`
                                                    : `linear-gradient(90deg,${G.blue}36,${G.green}36)`,
                                                transition: 'all 0.35s',
                                                // NEW: glow expands when URL filled
                                                boxShadow: sheetUrl ? `0 0 22px ${G.blue}20, 0 0 40px ${G.green}12` : 'none',
                                            }} />
                                            <TextField fullWidth variant="outlined"
                                                       placeholder="Paste your Sheet URL"
                                                       value={sheetUrl}
                                                       onChange={e => setSheetUrl(e.target.value)}
                                                       sx={{
                                                           position: 'relative', zIndex: 1,
                                                           '& .MuiOutlinedInput-root': {
                                                               borderRadius: '24px',
                                                               backgroundColor: 'rgba(255,255,255,0.98)',
                                                               fontSize: '1rem', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600,
                                                               '& fieldset': { border: 'none' },
                                                               '&:hover fieldset': { border: 'none' },
                                                               '&.Mui-focused fieldset': { border: 'none' },
                                                           },
                                                       }}
                                                       slotProps={{
                                                           input: {
                                                               startAdornment: (
                                                                   <InputAdornment position="start">
                                                                       <InsertLinkIcon sx={{ color: G.blue, fontSize: 24 }} />
                                                                   </InputAdornment>
                                                               ),
                                                           },
                                                       }}
                                            />
                                        </Box>

                                        <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", mb: 4, fontWeight: 700, color: 'rgba(0,0,0,0.30)', fontSize: '0.86rem', textAlign: 'center' }}>
                                            ⚡ Must be "Anyone with link can view"
                                        </Typography>

                                        {/* NEW: MagneticBtn + CSS shimmer sweep on CTA */}
                                        <MagneticBtn>
                                            <Button variant="contained" fullWidth size="large"
                                                    onClick={handleUploadClick}
                                                    disabled={!sheetUrl || isUploading}
                                                    data-hover="true"
                                                    sx={{
                                                        py: 2.2, borderRadius: '50px',
                                                        fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                                        fontSize: '1.12rem', textTransform: 'none',
                                                        background: `linear-gradient(90deg,${G.blue},${G.red},${G.yellow},${G.green},${G.blue})`,
                                                        backgroundSize: '300% 100%',
                                                        animation: IS_PERF_MODE ? 'none' : 'gradientFlow 4s ease infinite',
                                                        color: 'white', cursor: SHOW_CURSOR ? 'none' : 'auto',
                                                        boxShadow: `0 12px 36px ${G.blue}36, 0 2px 8px ${G.blue}1a`,
                                                        position: 'relative', overflow: 'hidden',
                                                        // NEW: CSS shimmer sweep on hover — zero JS
                                                        '&::after': {
                                                            content: '""',
                                                            position: 'absolute', inset: 0,
                                                            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.26) 50%, transparent 70%)',
                                                            transform: 'translateX(-130%) skewX(-20deg)',
                                                            transition: 'none',
                                                        },
                                                        '&:not(:disabled):hover': {
                                                            boxShadow: `0 18px 48px ${G.blue}48, 0 0 0 2px rgba(255,255,255,0.18)`,
                                                        },
                                                        '&:not(:disabled):hover::after': {
                                                            animation: 'shimmerBtn 0.55s ease-in-out 1',
                                                        },
                                                        '&:disabled': { background: '#e0e0e0', color: '#9e9e9e', boxShadow: 'none', animation: 'none' },
                                                    }}>
                                                ✦ Connect &amp; Start Audit
                                            </Button>
                                        </MagneticBtn>
                                    </Card>
                                </SpotlightCard>
                                </Box>
                            </TiltCard>
                        </motion.div>
                    )}
                </Box>

                {/* NEW: Decorative section separator */}
                {!isLoading && (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        mb: { xs: 8, md: 10 }, mt: { xs: -6, md: -10 }, px: 2,
                    }}>
                        <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(66,133,244,0.18), rgba(234,67,53,0.18))' }} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {G_COLORS.map((c, i) => (
                                <Box key={i} sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: c, opacity: 0.5,
                                    boxShadow: `0 0 7px ${c}`,
                                }} />
                            ))}
                        </Box>
                        <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(52,168,83,0.18), rgba(251,188,5,0.18), transparent)' }} />
                    </Box>
                )}

                {/* ══ TEMPLATES ═════════════════════════════════════════════════ */}
                <Box sx={{ mb: { xs: 12, md: 16 } }}>
                    {isLoading ? (
                        <Box sx={{ textAlign: 'center', mb: { xs: 7, md: 10 } }}>
                            <Skeleton width={300} height={50} style={{ marginBottom: 12 }} />
                            <Skeleton width={400} height={20} />
                        </Box>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.55 }}>
                            <Box sx={{ textAlign: 'center', mb: { xs: 7, md: 10 } }}>
                                {/* NEW: heading with gradient underline + outer glow */}
                                <Box sx={{ position: 'relative', display: 'inline-block', mb: 1.5 }}>
                                    <Typography sx={{
                                        fontFamily: "'Syne',sans-serif",
                                        fontSize: { xs: '2.2rem', md: '3.6rem' }, fontWeight: 900,
                                        letterSpacing: '-0.03em',
                                        background: `linear-gradient(135deg, #202124, ${G.blue})`,
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    }}>
                                        Choose a Context
                                    </Typography>
                                    {/* NEW: decorative gradient rule under heading */}
                                    <Box sx={{
                                        position: 'absolute', bottom: -10, left: '10%', right: '10%', height: 3,
                                        background: `linear-gradient(90deg, ${G.blue}, ${G.red}, ${G.yellow}, ${G.green})`,
                                        borderRadius: 2, opacity: 0.45,
                                    }} />
                                </Box>
                                <Typography sx={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '1.1rem', color: 'rgba(0,0,0,0.44)', fontWeight: 600, maxWidth: 480, mx: 'auto', mt: 2.5 }}>
                                    Select a domain for smart bias-detection parameters.
                                </Typography>
                            </Box>
                        </motion.div>
                    )}

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3,1fr)' }, gap: { xs: 3, md: 5 } }}>
                        {isLoading
                            ? Array(3).fill(0).map((_, i) => <Skeleton key={i} height={280} borderRadius={28} />)
                            : TEMPLATES.map((tpl, i) => (
                                <motion.div key={tpl.id}
                                            initial={{ opacity: 0, y: 40 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: '-16px' }}
                                            transition={{ delay: i * 0.11, type: 'spring', stiffness: 200, damping: 24 }}>
                                    <TiltCard>
                                        {/* Selected breathing glow */}
                                        {selectedTemplate === tpl.id && !IS_PERF_MODE && (
                                            <Box sx={{
                                                position: 'absolute', inset: -5, borderRadius: '34px',
                                                background: tpl.color, opacity: 0.22,
                                                filter: 'blur(14px)',
                                                animation: 'glowBreathe 2.2s ease-in-out infinite',
                                                zIndex: -1,
                                            }} />
                                        )}
                                        <SpotlightCard color={tpl.color} borderRadius="28px">
                                            <Card elevation={0}
                                                  onClick={() => setTemplate(tpl.id)}
                                                  data-hover="true"
                                                  sx={{
                                                      p: { xs: 4, md: 5 }, cursor: SHOW_CURSOR ? 'none' : 'auto', minHeight: 280,
                                                      display: 'flex', flexDirection: 'column',
                                                      alignItems: 'center', textAlign: 'center',
                                                      borderRadius: '28px', position: 'relative', overflow: 'hidden',
                                                      border: selectedTemplate === tpl.id
                                                          ? `2px solid ${tpl.color}52`
                                                          : '1.5px solid rgba(255,255,255,0.88)',
                                                      background: selectedTemplate === tpl.id
                                                          ? `linear-gradient(145deg,${tpl.color}10,${tpl.color}04,rgba(255,255,255,0.9))`
                                                          : 'rgba(255,255,255,0.86)',
                                                      backdropFilter: IS_PERF_MODE ? 'none' : 'blur(8px)',
                                                      boxShadow: selectedTemplate === tpl.id
                                                          ? `0 18px 48px ${tpl.color}22, inset 0 0 22px ${tpl.color}05`
                                                          : '0 6px 28px rgba(0,0,0,0.06)',
                                                      transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                                                      // NEW: color-bleed hover effect
                                                      '&:hover': {
                                                          transform: 'translateY(-2px)',
                                                          boxShadow: selectedTemplate === tpl.id
                                                              ? `0 24px 56px ${tpl.color}30, inset 0 0 28px ${tpl.color}07`
                                                              : `0 14px 40px rgba(0,0,0,0.09), 0 0 0 1px ${tpl.color}14, 0 0 28px ${tpl.color}09`,
                                                          borderColor: selectedTemplate === tpl.id
                                                              ? `${tpl.color}68` : `${tpl.color}20`,
                                                      },
                                                  }}>

                                                {/* Corner accent glow */}
                                                {!IS_PERF_MODE && (
                                                    <Box sx={{
                                                        position: 'absolute', top: -22, right: -22,
                                                        width: 88, height: 88, borderRadius: '50%',
                                                        background: `radial-gradient(circle,${tpl.color}12,transparent)`,
                                                        filter: 'blur(12px)', pointerEvents: 'none',
                                                    }} />
                                                )}

                                                {/* Check badge — NEW: spring bounce entrance */}
                                                <AnimatePresence>
                                                    {selectedTemplate === tpl.id && (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -45 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            exit={{ scale: 0, rotate: 45 }}
                                                            transition={{ type: 'spring', bounce: 0.52 }}
                                                            style={{ position: 'absolute', top: 16, right: 16 }}>
                                                            <Box sx={{
                                                                width: 26, height: 26, borderRadius: '50%',
                                                                background: tpl.color,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                boxShadow: `0 3px 12px ${tpl.color}55, 0 0 0 3px ${tpl.color}20`,
                                                            }}>
                                                                <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900 }}>✓</Typography>
                                                            </Box>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Icon — color glow + bounce on select */}
                                                <motion.div
                                                    animate={selectedTemplate === tpl.id
                                                        ? { rotate: [0, 14, -9, 0], scale: [1, 1.14, 1.08, 1.18] }
                                                        : {}}
                                                    transition={{ duration: 0.5 }}>
                                                    <Box sx={{
                                                        mb: 3, p: 2.8, borderRadius: '50%',
                                                        background: selectedTemplate === tpl.id ? '#fff' : 'rgba(255,255,255,0.9)',
                                                        boxShadow: selectedTemplate === tpl.id
                                                            ? `0 10px 30px ${tpl.color}34, 0 0 0 4px ${tpl.color}10`
                                                            : '0 6px 18px rgba(0,0,0,0.08)',
                                                        transition: 'all 0.35s',
                                                        position: 'relative', zIndex: 2,
                                                        // NEW: icon glow ring grows on hover
                                                        '&:hover': {
                                                            boxShadow: `0 12px 32px ${tpl.color}3c, 0 0 0 6px ${tpl.color}14`,
                                                            transform: 'scale(1.07)',
                                                        },
                                                    }}>
                                                        {tpl.icon}
                                                    </Box>
                                                </motion.div>

                                                {/* Title — shifts to brand color when selected */}
                                                <Typography sx={{
                                                    fontFamily: "'Syne',sans-serif", fontWeight: 900,
                                                    fontSize: { xs: '1.18rem', md: '1.38rem' },
                                                    color: selectedTemplate === tpl.id ? tpl.color : '#202124',
                                                    letterSpacing: '-0.02em', mb: 0.8,
                                                    position: 'relative', zIndex: 2,
                                                    transition: 'color 0.28s',
                                                }}>
                                                    {tpl.title}
                                                </Typography>
                                                <Typography sx={{
                                                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                                                    color: 'rgba(0,0,0,0.44)', lineHeight: 1.6,
                                                    fontWeight: 600, fontSize: '0.9rem',
                                                    position: 'relative', zIndex: 2,
                                                }}>
                                                    {tpl.subtext}
                                                </Typography>

                                                {/* Bottom accent bar — scaleX slide-in */}
                                                <Box sx={{
                                                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                                                    background: `linear-gradient(90deg, transparent, ${tpl.color}, transparent)`,
                                                    opacity: selectedTemplate === tpl.id ? 1 : 0,
                                                    transform: selectedTemplate === tpl.id ? 'scaleX(1)' : 'scaleX(0)',
                                                    transition: 'opacity 0.3s, transform 0.42s cubic-bezier(0.175,0.885,0.32,1.275)',
                                                    transformOrigin: 'center',
                                                }} />
                                            </Card>
                                        </SpotlightCard>
                                    </TiltCard>
                                </motion.div>
                            ))
                        }
                    </Box>
                </Box>
            </Container>

            <Snackbar
                open={!!error} autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setError('')} severity="error" sx={{
                    width: '100%', borderRadius: '16px', fontWeight: 800, fontSize: '1rem',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    boxShadow: `0 8px 28px ${G.red}28`,
                }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}

