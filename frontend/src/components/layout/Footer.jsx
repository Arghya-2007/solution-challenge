import { useEffect, useRef } from 'react';
import { Box, Typography, GlobalStyles } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ─── Brand palette ─────────────────────────────────────────────────────────────
const G = {
    blue:   '#4285F4',
    red:    '#EA4335',
    yellow: '#FBBC05',
    green:  '#34A853',
    dark:   '#202124',
    mid:    '#5F6368',
};
const G_COLORS = [G.blue, G.red, G.yellow, G.green];

// ─── Navigation links ──────────────────────────────────────────────────────────
const LINKS = {
    Product: [
        { label: 'How It Works',     to: '/#how-it-works' },
        { label: 'Run an Audit',     to: '/analyze'       },
        { label: 'Mitigation',       to: '/recommendation' },
        { label: 'Bias Types',       to: '/#bias-types'   },
    ],
    Company: [
        { label: 'About EquiLens',   href: '#' },
        { label: 'Research',         href: '#' },
        { label: 'Blog',             href: '#' },
        { label: 'Careers',          href: '#' },
    ],
    Legal: [
        { label: 'Privacy Policy',   href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy',    href: '#' },
        { label: 'SOC2 Compliance',  href: '#' },
    ],
};

// ─── Social icons (inline SVG — zero dep, zero network request) ───────────────
const SOCIALS = [
    {
        label: 'GitHub',
        color: G.dark,
        href:  '#',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
        ),
    },
    {
        label: 'Twitter / X',
        color: G.dark,
        href:  '#',
        icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: 'LinkedIn',
        color: G.blue,
        href:  '#',
        icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
];

// ─── Stat row ──────────────────────────────────────────────────────────────────
const STATS = [
    { value: '99.8%',  label: 'Accuracy',    color: G.blue   },
    { value: '<3s',    label: 'Audit Time',  color: G.red    },
    { value: '12+',    label: 'Bias Types',  color: G.yellow },
    { value: 'SOC2',   label: 'Certified',   color: G.green  },
];

// ─── Dot-grid canvas — lightweight, drawn once, no animation ──────────────────
function DotGrid() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx   = canvas.getContext('2d');
        const W     = canvas.offsetWidth;
        const H     = canvas.offsetHeight;
        canvas.width  = W;
        canvas.height = H;
        const GAP = 28, R = 1.1;
        for (let x = GAP; x < W; x += GAP) {
            for (let y = GAP; y < H; y += GAP) {
                // Fade dots near edges
                const ex = Math.min(x / W, (W - x) / W);
                const ey = Math.min(y / H, (H - y) / H);
                const a  = Math.min(ex, ey) * 6 * 0.18;
                ctx.globalAlpha = Math.min(a, 0.18);
                ctx.fillStyle   = '#4285F4';
                ctx.beginPath();
                ctx.arc(x, y, R, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }, []);
    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 0,
            }}
        />
    );
}

// ─── Link item with hover underline slide ─────────────────────────────────────
function FooterLink({ label, to, href }) {
    const navigate = useNavigate();
    const handleClick = (e) => {
        if (to) {
            e.preventDefault();
            if (to.startsWith('/#')) {
                const id = to.slice(2);
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/');
            } else {
                navigate(to);
            }
        }
    };

    const Tag  = to ? 'a' : 'a';
    const dest = to || href || '#';

    return (
        <Box
            component={Tag}
            href={dest}
            onClick={to ? handleClick : undefined}
            sx={{
                display: 'inline-block', position: 'relative',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 600, fontSize: '0.88rem',
                color: 'rgba(255,255,255,0.58)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': { color: 'rgba(255,255,255,0.95)' },
                // Underline slide-in on hover
                '&::after': {
                    content: '""',
                    position: 'absolute', bottom: -2, left: 0,
                    width: '100%', height: '1.5px',
                    background: 'rgba(255,255,255,0.5)',
                    transform: 'scaleX(0)', transformOrigin: 'left',
                    transition: 'transform 0.22s ease',
                },
                '&:hover::after': { transform: 'scaleX(1)' },
            }}>
            {label}
        </Box>
    );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                position: 'relative', overflow: 'hidden',
                background: G.dark,
                pt: { xs: 7, md: 10 }, pb: { xs: 4, md: 5 },
            }}>
            <GlobalStyles styles={{
                '@keyframes gradientRail': {
                    '0%,100%': { backgroundPosition: '0% 50%'   },
                    '50%':     { backgroundPosition: '100% 50%' },
                },
                '@keyframes dotPop': {
                    '0%,100%': { transform: 'scale(1)',   opacity: '0.7' },
                    '50%':     { transform: 'scale(1.75)', opacity: '1'  },
                },
                '@keyframes footerFadeUp': {
                    '0%':   { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)'    },
                },
            }} />

            {/* ── Dot grid — painted once, static ──────────────────────── */}
            <DotGrid />

            {/* ── Radial glow behind wordmark ────────────────────────────── */}
            <Box aria-hidden="true" sx={{
                position: 'absolute', top: '-30%', left: '50%',
                transform: 'translateX(-50%)',
                width: '70vw', height: '70vw', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(66,133,244,0.09) 0%, transparent 65%)',
                pointerEvents: 'none', zIndex: 0,
            }} />

            {/* ── Rainbow top rail ────────────────────────────────────────── */}
            <Box aria-hidden="true" sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: `linear-gradient(90deg,${G.blue},${G.red},${G.yellow},${G.green},${G.blue})`,
                backgroundSize: '250% 100%',
                animation: 'gradientRail 5s linear infinite',
            }} />

            <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.5, md: 5 }, position: 'relative', zIndex: 1 }}>

                {/* ══ HERO WORDMARK ROW ════════════════════════════════════════ */}
                <Box sx={{
                    display: 'flex', flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { md: 'flex-end' }, justifyContent: 'space-between',
                    gap: 4, mb: { xs: 6, md: 8 },
                    animation: 'footerFadeUp 0.55s ease both',
                }}>
                    {/* Wordmark + tagline */}
                    <Box>
                        {/* Google-dot row */}
                        <Box sx={{ display: 'flex', gap: 0.7, mb: 2 }}>
                            {G_COLORS.map((c, i) => (
                                <Box key={i} sx={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: c,
                                    boxShadow: `0 0 8px ${c}80`,
                                    animation: `dotPop 1.5s ease-in-out ${i * 0.25}s infinite`,
                                }} />
                            ))}
                        </Box>

                        <Typography sx={{
                            fontFamily: "'Syne',sans-serif",
                            fontWeight: 900,
                            fontSize: { xs: '2.6rem', md: '3.8rem' },
                            letterSpacing: '-0.04em', lineHeight: 0.95,
                            color: '#fff',
                        }}>
                            Equi
                            <Box component="span" sx={{
                                background: `linear-gradient(135deg, ${G.blue}, ${G.green})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Lens
                            </Box>
                        </Typography>

                        <Typography sx={{
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            fontWeight: 600, fontSize: { xs: '0.9rem', md: '1rem' },
                            color: 'rgba(255,255,255,0.42)',
                            mt: 1.5, maxWidth: 340, lineHeight: 1.6,
                        }}>
                            AI-powered fairness auditing for hiring, loans, and admissions — powered by state-of-the-art bias detection.
                        </Typography>
                    </Box>

                    {/* Stats mini-row */}
                    <Box sx={{
                        display: 'flex', gap: { xs: 2, md: 3 },
                        flexWrap: 'wrap', alignItems: 'center',
                    }}>
                        {STATS.map((s, i) => (
                            <Box key={i} sx={{
                                textAlign: 'center',
                                px: 2.5, py: 1.6,
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                transition: 'background 0.22s, border-color 0.22s, transform 0.22s',
                                '&:hover': {
                                    background: `${s.color}14`,
                                    borderColor: `${s.color}30`,
                                    transform: 'translateY(-3px)',
                                },
                            }}>
                                <Typography sx={{
                                    fontFamily: "'Syne',sans-serif",
                                    fontWeight: 900, fontSize: '1.3rem',
                                    color: s.color, lineHeight: 1,
                                }}>
                                    {s.value}
                                </Typography>
                                <Typography sx={{
                                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                                    fontWeight: 600, fontSize: '0.68rem',
                                    color: 'rgba(255,255,255,0.36)',
                                    mt: 0.4, letterSpacing: '0.06em', textTransform: 'uppercase',
                                }}>
                                    {s.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* ══ DIVIDER ══════════════════════════════════════════════════ */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: { xs: 6, md: 8 } }}>
                    <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(66,133,244,0.20))' }} />
                    <Box sx={{ display: 'flex', gap: 0.8 }}>
                        {G_COLORS.map((c, i) => (
                            <Box key={i} sx={{ width: 5, height: 5, borderRadius: '50%', background: c, opacity: 0.4 }} />
                        ))}
                    </Box>
                    <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(52,168,83,0.20), rgba(255,255,255,0.08), transparent)' }} />
                </Box>

                {/* ══ LINK COLUMNS ═════════════════════════════════════════════ */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', md: '2fr 1fr 1fr 1fr' },
                    gap: { xs: 5, md: 6 },
                    mb: { xs: 7, md: 9 },
                }}>
                    {/* Brand blurb column */}
                    <Box sx={{ gridColumn: { xs: '1 / -1', md: '1' } }}>
                        <Typography sx={{
                            fontFamily: "'Syne',sans-serif",
                            fontWeight: 800, fontSize: '0.82rem',
                            color: 'rgba(255,255,255,0.3)',
                            letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2.5,
                        }}>
                            About
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            fontWeight: 500, fontSize: '0.88rem',
                            color: 'rgba(255,255,255,0.42)',
                            lineHeight: 1.72, maxWidth: 300, mb: 3,
                        }}>
                            EquiLens detects hidden discrimination in algorithmic decision-making — before it affects real people. Built for fairness engineers, data scientists, and compliance teams.
                        </Typography>

                        {/* SOC2 + badge row */}
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {['SOC2 Type II', 'GDPR Ready', 'Open Source'].map((b, i) => (
                                <Box key={i} sx={{
                                    px: 1.8, py: 0.55, borderRadius: 100,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.10)',
                                }}>
                                    <Typography sx={{
                                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                                        fontWeight: 700, fontSize: '0.68rem',
                                        color: 'rgba(255,255,255,0.40)',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {b}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Link columns */}
                    {Object.entries(LINKS).map(([col, links]) => (
                        <Box key={col}>
                            <Typography sx={{
                                fontFamily: "'Syne',sans-serif",
                                fontWeight: 800, fontSize: '0.82rem',
                                color: 'rgba(255,255,255,0.30)',
                                letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2.5,
                            }}>
                                {col}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                                {links.map(l => (
                                    <FooterLink key={l.label} {...l} />
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* ══ BOTTOM BAR ═══════════════════════════════════════════════ */}
                <Box sx={{
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    pt: { xs: 3.5, md: 4 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 3,
                }}>
                    {/* Copyright */}
                    <Typography sx={{
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        fontWeight: 600, fontSize: '0.82rem',
                        color: 'rgba(255,255,255,0.24)',
                    }}>
                        © {new Date().getFullYear()} EquiLens. All rights reserved.
                        {' '}Made with{' '}
                        <Box component="span" sx={{ color: G.red }}>♥</Box>
                        {' '}for a fairer world.
                    </Typography>

                    {/* Social icons */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        {SOCIALS.map(s => (
                            <Box
                                key={s.label}
                                component="a"
                                href={s.href}
                                aria-label={s.label}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    width: 36, height: 36, borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.40)',
                                    transition: 'all 0.22s ease',
                                    '&:hover': {
                                        background: `${s.color}18`,
                                        borderColor: `${s.color}40`,
                                        color: s.color === G.dark ? 'rgba(255,255,255,0.9)' : s.color,
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 6px 16px ${s.color === G.dark ? 'rgba(255,255,255,0.08)' : s.color + '28'}`,
                                    },
                                }}>
                                {s.icon}
                            </Box>
                        ))}

                        {/* Divider pip */}
                        <Box sx={{ width: 1, height: 20, background: 'rgba(255,255,255,0.10)', mx: 0.5 }} />

                        {/* "Back to top" */}
                        <Box
                            component="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            aria-label="Back to top"
                            sx={{
                                width: 36, height: 36, borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.40)',
                                cursor: 'pointer',
                                transition: 'all 0.22s ease',
                                '&:hover': {
                                    background: `${G.blue}18`,
                                    borderColor: `${G.blue}40`,
                                    color: G.blue,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 6px 16px ${G.blue}28`,
                                },
                            }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15" />
                            </svg>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
