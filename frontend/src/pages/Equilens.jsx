/**
 * EquiLensLanding.jsx
 * Enhanced with Framer Motion, Tailwind CSS, 3D animations, Google brand colors
 * Performance-optimised for low-end devices with reduced motion support
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useInView,
    useMotionValue,
    useSpring,
    AnimatePresence,
} from "framer-motion";
// Video now loaded from public folder for fast chunked streaming
import SEO from "../components/SEO";
import Logo from "../components/Logo";
// ─── GOOGLE BRAND PALETTE ─────────────────────────────────────────────────────
const G = {
    blue:   "#1A73E8",
    green:  "#34A853",
    yellow: "#FBBC04",
    red:    "#EA4335",
    navy:   "#08081A",
    dark:   "#0D0D22",
    mid:    "#0A0A1F",
    dim:    "#060612",
    lightBlue: "#7AB8FF",
    lightGreen:"#81C995",
    lightRed:  "#F28B82",
};

// ─── PERFORMANCE HELPERS ──────────────────────────────────────────────────────
const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (d = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, delay: d, ease: [0.22, 1, 0.36, 1] },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

// ─── MAGNETIC BUTTON HOOK ─────────────────────────────────────────────────────
function useMagnetic(strength = 0.35) {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 200, damping: 20 });
    const sy = useSpring(y, { stiffness: 200, damping: 20 });

    useEffect(() => {
        if (prefersReducedMotion()) return;
        const el = ref.current;
        if (!el) return;
        const onMove = (e) => {
            const r = el.getBoundingClientRect();
            x.set((e.clientX - r.left - r.width / 2) * strength);
            y.set((e.clientY - r.top - r.height / 2) * strength);
        };
        const onLeave = () => { x.set(0); y.set(0); };
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
    }, [strength, x, y]);

    return { ref, style: { x: sx, y: sy } };
}

// ─── 3D TILT CARD ─────────────────────────────────────────────────────────────
function TiltCard({ children, className = "", style = {} }) {
    const ref = useRef(null);
    const rx = useMotionValue(0);
    const ry = useMotionValue(0);
    const srx = useSpring(rx, { stiffness: 150, damping: 18 });
    const sry = useSpring(ry, { stiffness: 150, damping: 18 });

    const onMove = useCallback((e) => {
        if (prefersReducedMotion()) return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        rx.set(ny * -14);
        ry.set(nx * 14);
    }, [rx, ry]);
    const onLeave = useCallback(() => { rx.set(0); ry.set(0); }, [rx, ry]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", ...style }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "", prefix = "" }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });

    useEffect(() => {
        if (!inView) return;
        const num = parseFloat(target.replace(/[^0-9.]/g, ""));
        if (isNaN(num)) { setVal(target); return; }
        let start = 0;
        const duration = 1400;
        let animationFrameId;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(ease * num * 10) / 10);
            if (p < 1) {
                animationFrameId = requestAnimationFrame(step);
            }
        };
        animationFrameId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animationFrameId);
    }, [inView, target]);

    return (
        <span ref={ref}>
      {prefix}{typeof val === "number" ? val : target}{suffix}
    </span>
    );
}

// ─── FLOATING PARTICLES ───────────────────────────────────────────────────────
function Particles({ count = 18 }) {
    if (prefersReducedMotion()) return null;
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: count }).map((_, i) => {
                const colors = [G.blue, G.green, G.yellow, G.red];
                const color = colors[i % 4];
                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: Math.random() * 4 + 2,
                            height: Math.random() * 4 + 2,
                            background: color,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: 0.25,
                        }}
                        animate={{
                            y: [0, -40 - Math.random() * 40, 0],
                            opacity: [0.1, 0.4, 0.1],
                            scale: [1, 1.4, 1],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 4,
                            ease: "easeInOut",
                        }}
                    />
                );
            })}
        </div>
    );
}

// ─── SCROLL SVG LINE ──────────────────────────────────────────────────────────
function ScrollSVGPath() {
    const { scrollYProgress } = useScroll();
    const pathLen = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <div className="fixed left-4 top-0 bottom-0 w-6 z-50 pointer-events-none hidden lg:block">
            <svg viewBox="0 0 24 900" className="w-full h-full" preserveAspectRatio="none">
                <path
                    d="M12 0 C12 0, 4 100, 12 200 C20 300, 4 400, 12 500 C20 600, 4 700, 12 900"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="2"
                />
                <motion.path
                    d="M12 0 C12 0, 4 100, 12 200 C20 300, 4 400, 12 500 C20 600, 4 700, 12 900"
                    fill="none"
                    stroke="url(#scrollGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ pathLength: pathLen }}
                />
                <defs>
                    <linearGradient id="scrollGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={G.blue} />
                        <stop offset="33%" stopColor={G.green} />
                        <stop offset="66%" stopColor={G.yellow} />
                        <stop offset="100%" stopColor={G.red} />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

// ─── GRID BACKGROUND ──────────────────────────────────────────────────────────
function GridBg() {
    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)`,
                backgroundSize: "44px 44px",
            }}
        />
    );
}

// ─── GLOW BLOB ────────────────────────────────────────────────────────────────
function GlowBlob({ color, className = "" }) {
    return (
        <motion.div
            className={`absolute rounded-full pointer-events-none ${className}`}
            style={{ background: color, filter: "blur(90px)", opacity: 0.22 }}
            animate={prefersReducedMotion() ? {} : {
                scale: [1, 1.12, 0.95, 1],
                x: [0, 30, -20, 0],
                y: [0, -25, 18, 0],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
    );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ scrolled }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const links = [
        ["#problem", "Problem"],
        ["#solution", "Features"],
        ["#demo", "Demo"],
        ["#how", "How It Works"],
        ["#tech", "Tech"],
    ];

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-[200] h-[66px] flex items-center justify-between px-6 lg:px-12 transition-all duration-500"
            style={{
                background: scrolled ? "rgba(8,8,26,0.9)" : "transparent",
                backdropFilter: scrolled ? "blur(24px)" : "none",
                boxShadow: scrolled ? "0 1px 0 rgba(255,255,255,0.07)" : "none",
            }}
        >
            {/* Logo */}
            <a href="#hero" className="flex items-center gap-2.5 no-underline group">
                <Logo width={36} height={36} />
                <span className="text-[19px] font-extrabold text-white tracking-tight">
          Equi<span style={{ color: G.green }}>Lens</span>
        </span>
            </a>

            {/* Desktop Links */}
            <ul className="hidden lg:flex items-center gap-9 list-none">
                {links.map(([href, label]) => (
                    <li key={href}>
                        <motion.a
                            href={href}
                            className="no-underline text-sm font-medium"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                            whileHover={{ color: "#fff", y: -1 }}
                            transition={{ duration: 0.15 }}
                        >
                            {label}
                        </motion.a>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <motion.a
                href="#demo"
                className="hidden lg:block no-underline text-white text-[13.5px] font-bold px-5 py-2.5 rounded-full"
                style={{ background: G.blue }}
                whileHover={{ background: "#1558CC", y: -1, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
            >
                Get Early Access
            </motion.a>

            {/* Mobile Menu */}
            <button
                className="lg:hidden text-white p-2"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
            >
                <div className="w-5 space-y-1.5">
                    <motion.span
                        className="block h-0.5 bg-white rounded"
                        animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                    />
                    <motion.span
                        className="block h-0.5 bg-white rounded"
                        animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                    />
                    <motion.span
                        className="block h-0.5 bg-white rounded"
                        animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                    />
                </div>
            </button>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="absolute top-full left-0 right-0 py-4 px-6"
                        style={{ background: "rgba(8,8,26,0.97)", backdropFilter: "blur(24px)" }}
                    >
                        {links.map(([href, label]) => (
                            <a
                                key={href}
                                href={href}
                                className="block py-3 text-sm font-medium no-underline border-b border-white/5"
                                style={{ color: "rgba(255,255,255,0.75)" }}
                                onClick={() => setMenuOpen(false)}
                            >
                                {label}
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

// ─── BIAS WIDGET ──────────────────────────────────────────────────────────────
function BiasWidget() {
    const [phase, setPhase] = useState("biased");
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        let timeouts = [];
        const run = () => {
            timeouts.push(setTimeout(() => setScanning(true), 3800));
            timeouts.push(setTimeout(() => { setPhase("fixed"); setScanning(false); }, 5800));
            timeouts.push(setTimeout(() => setPhase("biased"), 10500));
        };
        run();
        const id = setInterval(run, 11000);
        return () => {
            clearInterval(id);
            timeouts.forEach(clearTimeout);
            timeouts = [];
        };
    }, []);

    const fixed = phase === "fixed";
    const bars = [
        { label: "Male",    biasedH: 72, fixedH: 46, biasedPct: 55, fixedPct: 38, biasedColor: G.blue },
        { label: "Female",  biasedH: 20, fixedH: 44, biasedPct: 18, fixedPct: 36, biasedColor: G.red },
        { label: "Non-Bin", biasedH: 30, fixedH: 42, biasedPct: 23, fixedPct: 35, biasedColor: G.yellow },
    ];

    return (
        <motion.div
            className="relative rounded-3xl p-7 overflow-hidden"
            style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(20px)",
            }}
            animate={prefersReducedMotion() ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Subtle inner glow */}
            <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                    background: fixed
                        ? `radial-gradient(ellipse at 50% 0%, rgba(52,168,83,0.12), transparent 65%)`
                        : `radial-gradient(ellipse at 50% 0%, rgba(234,67,53,0.10), transparent 65%)`,
                    transition: "background 1s ease",
                }}
            />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-[15px] font-bold text-white/90">⚖️ Live Bias Analysis</span>
                <motion.span
                    className="px-3 py-1 rounded-full text-xs font-black tracking-wide"
                    style={{
                        background: fixed ? "rgba(52,168,83,0.2)" : "rgba(234,67,53,0.2)",
                        color: fixed ? G.lightGreen : G.lightRed,
                        border: `1px solid ${fixed ? "rgba(52,168,83,0.35)" : "rgba(234,67,53,0.35)"}`,
                    }}
                    layout
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 0.4 }}
                >
                    {fixed ? "✓ LOW RISK 28" : "⚠ CRITICAL 74"}
                </motion.span>
            </div>

            {/* Scan line */}
            <div className="relative overflow-hidden rounded-xl mb-6 h-40">
                <AnimatePresence>
                    {scanning && (
                        <motion.div
                            className="absolute left-0 right-0 h-0.5 z-10 pointer-events-none"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${G.blue}, ${G.green}, transparent)`,
                                boxShadow: `0 0 12px ${G.blue}`,
                            }}
                            initial={{ top: -4, opacity: 0 }}
                            animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.8, ease: "linear" }}
                        />
                    )}
                </AnimatePresence>

                {/* Bars */}
                <div className="flex items-end justify-around h-full px-4 pb-1">
                    {bars.map((b) => (
                        <div key={b.label} className="flex flex-col items-center gap-1.5 flex-1">
                            <motion.span
                                className="text-xs font-bold"
                                style={{ color: fixed ? G.lightGreen : "rgba(255,255,255,0.8)" }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                {fixed ? b.fixedPct : b.biasedPct}%
                            </motion.span>
                            <div className="flex items-end justify-center" style={{ height: 90 }}>
                                <motion.div
                                    className="w-12 rounded-t-lg relative overflow-hidden"
                                    animate={{
                                        height: `${fixed ? b.fixedH : b.biasedH}%`,
                                        background: fixed
                                            ? `linear-gradient(180deg, ${G.green}, ${G.blue})`
                                            : b.biasedColor,
                                    }}
                                    style={{ height: "60%" }}
                                    transition={{ duration: 1.3, ease: [0.34, 1.56, 0.64, 1] }}
                                >
                                    {/* Shimmer */}
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                                        }}
                                        animate={{ x: ["-100%", "200%"] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
                                    />
                                </motion.div>
                            </div>
                            <span className="text-[11.5px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                {b.label}
              </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer metrics */}
            <div className="flex gap-4 pt-4 border-t border-white/8">
                {[
                    { label: "AIR Score", biased: "0.32", ok: "0.94", color: fixed ? G.green : G.red },
                    { label: "EEOC",      biased: "FAIL",  ok: "PASS", color: fixed ? G.green : G.red },
                    { label: "Records",   biased: "3,500", ok: "3,500", color: G.yellow },
                ].map(({ label, biased, ok, color }) => (
                    <div key={label} className="flex-1">
                        <div className="text-[10.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.38)" }}>
                            {label}
                        </div>
                        <motion.div
                            className="text-[19px] font-black"
                            style={{ color }}
                            animate={{ color }}
                            transition={{ duration: 0.9 }}
                        >
                            {fixed ? ok : biased}
                        </motion.div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
    const { scrollYProgress } = useScroll();
    const yText = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
    const opText = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center overflow-hidden"
            style={{ background: G.navy, paddingTop: 100, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}
        >
            {/* Blobs */}
            <GlowBlob color={G.blue}   className="w-[680px] h-[680px] -top-36 -left-44" />
            <GlowBlob color={G.green}  className="w-[560px] h-[560px] -bottom-24 -right-32" />
            <GlowBlob color={G.red}    className="w-[420px] h-[420px] top-[38%] left-[40%]" />
            <GridBg />
            <Particles count={20} />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            <motion.div
                style={{ y: yText, opacity: opText }}
                className="relative z-10 max-w-[1240px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
                {/* Left */}
                <div>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12.5px] font-bold mb-5"
                        style={{
                            background: "rgba(26,115,232,0.12)",
                            border: `1px solid rgba(26,115,232,0.35)`,
                            color: G.lightBlue,
                        }}
                    >
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: G.blue }}
                            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                        />
                        Google Solution Challenge 2026 — Top 100
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.1}
                        className="font-black leading-[1.08] text-white mb-4 tracking-tight"
                        style={{ fontSize: "clamp(38px,5vw,62px)", letterSpacing: "-1px" }}
                    >
                        Stop Hiring Bias.
                        <br />
                        <span
                            style={{
                                background: `linear-gradient(135deg, ${G.blue} 0%, ${G.green} 45%, ${G.yellow} 100%)`,
                                backgroundSize: "200% 200%",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                animation: "gradShift 5s ease infinite",
                            }}
                        >
              Before It Costs You.
            </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.2}
                        className="text-lg leading-relaxed mb-8 max-w-[500px]"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                        EquiLens detects, explains, and fixes bias in your HR data — powered by Vertex AI and built for HR compliance teams.
                    </motion.p>

                    {/* Chips */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="flex gap-2.5 flex-wrap mb-8"
                    >
                        {[
                            { text: "✓ EEOC Compliant", color: G.green },
                            { text: "⚡ Vertex AI Powered", color: G.lightBlue },
                            { text: "⏱ 30s to Risk Score", color: G.yellow },
                        ].map(({ text, color }) => (
                            <motion.span
                                key={text}
                                variants={fadeUp}
                                className="px-4 py-1.5 rounded-full text-[13px] font-semibold border"
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    borderColor: "rgba(255,255,255,0.13)",
                                    color,
                                }}
                                whileHover={{ scale: 1.05, borderColor: color + "55" }}
                            >
                                {text}
                            </motion.span>
                        ))}
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.4}
                        className="flex gap-3.5 flex-wrap items-center"
                    >
                        <PrimaryBtn href="#demo">
                            See Live Demo <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
                        </PrimaryBtn>
                        <motion.a
                            href="#how"
                            className="no-underline font-semibold px-6 py-4 rounded-[14px] text-[15px] border"
                            style={{
                                color: "rgba(255,255,255,0.7)",
                                background: "rgba(255,255,255,0.06)",
                                borderColor: "rgba(255,255,255,0.14)",
                            }}
                            whileHover={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                        >
                            How It Works
                        </motion.a>
                        <motion.a
                            href="/optimized-video.mp4"
                            download="EquiLens-Demo.mp4"
                            className="no-underline font-semibold px-6 py-4 rounded-[14px] text-[15px] border"
                            style={{
                                color: "rgba(255,255,255,0.7)",
                                background: "rgba(255,255,255,0.06)",
                                borderColor: "rgba(255,255,255,0.14)",
                            }}
                            whileHover={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                        >
                            Download Video
                        </motion.a>
                    </motion.div>
                </div>

                {/* Right – Widget */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={0.25}
                >
                    <TiltCard>
                        <BiasWidget />
                    </TiltCard>
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
            >
                <div className="w-px h-8" style={{ background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.3))` }} />
                <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
          Scroll
        </span>
            </motion.div>

            <style>{`
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      `}</style>
        </section>
    );
}

// ─── PRIMARY BUTTON ───────────────────────────────────────────────────────────
function PrimaryBtn({ href, children, style = {} }) {
    const mag = useMagnetic(0.25);
    return (
        <motion.a
            href={href}
            ref={mag.ref}
            style={{
                background: G.blue,
                ...mag.style,
                ...style,
            }}
            className="group no-underline text-white font-bold text-[15.5px] px-8 py-4 rounded-[14px] flex items-center gap-2 relative overflow-hidden"
            whileHover={{ background: "#1558CC", y: -2, boxShadow: `0 0 30px ${G.blue}55` }}
            whileTap={{ scale: 0.97 }}
        >
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {children}
        </motion.a>
    );
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
    const stats = [
        { num: "73", suffix: "%", label: "of Fortune 500 use AI in hiring — without auditing for bias", color: G.red },
        { num: "3",  suffix: "×", label: "gender disparity detected in our benchmark HR datasets", color: G.yellow },
        { num: "64", prefix: "$", suffix: "B", label: "annual cost of HR bias through turnover and litigation (US)", color: G.green },
        { num: "30", suffix: "s", label: "to generate a full bias report on 10,000 employee records", color: G.blue },
    ];

    return (
        <div className="border-t border-b border-white/5 py-10 px-6 lg:px-12" style={{ background: "#0F0F24" }}>
            <div className="max-w-[1040px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                {stats.map(({ num, suffix, prefix, label, color }, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-40px" }}
                        custom={i * 0.1}
                    >
                        <div className="text-[40px] lg:text-[46px] font-black mb-1.5" style={{ color }}>
                            {prefix}<Counter target={num} suffix={suffix} prefix="" />{prefix ? "" : ""}
                        </div>
                        <div className="text-[13px] leading-relaxed max-w-[160px] mx-auto" style={{ color: "rgba(255,255,255,0.42)" }}>
                            {label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────────
function Section({ id, bg, children, className = "" }) {
    return (
        <section id={id} className={`py-24 lg:py-32 px-6 lg:px-12 ${className}`} style={{ background: bg }}>
            <div className="max-w-[1200px] mx-auto">{children}</div>
        </section>
    );
}

// ─── EYEBROW ──────────────────────────────────────────────────────────────────
function Eyebrow({ color, bg, children }) {
    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="inline-block text-[11.5px] font-black uppercase tracking-[1.3px] mb-4 px-3.5 py-1 rounded-full"
            style={{ background: bg, color }}
        >
            {children}
        </motion.div>
    );
}

// ─── PROBLEM ──────────────────────────────────────────────────────────────────
function Problem() {
    const cards = [
        { icon: "⚡", title: "Speed Over Fairness", text: "Automated hiring tools process thousands of candidates in seconds — embedding historical bias at massive scale, invisibly and legally.", c: G.red, cbg: "rgba(234,67,53,0.08)", cb: "rgba(234,67,53,0.2)" },
        { icon: "📊", title: "Data Without Insight", text: "HR teams have spreadsheets full of hiring data but no tool to read the patterns. The bias is always there — it just goes undetected.", c: G.yellow, cbg: "rgba(251,188,4,0.08)", cb: "rgba(251,188,4,0.2)" },
        { icon: "⚖️", title: "Silent Legal Exposure", text: "EEOC Adverse Impact violations are only discovered after lawsuits. One unaudited dataset can expose an organisation to eight-figure liability.", c: G.blue, cbg: "rgba(26,115,232,0.08)", cb: "rgba(26,115,232,0.2)" },
    ];

    return (
        <Section id="problem" bg={G.dark}>
            <Eyebrow color={G.lightRed} bg="rgba(234,67,53,0.12)">The Problem</Eyebrow>
            <motion.h2
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-black text-white mb-4 tracking-tight"
                style={{ fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.14, letterSpacing: "-0.5px" }}
            >
                The Hidden Crisis<br />in Every HR Dataset
            </motion.h2>
            <motion.p
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
                className="text-[17.5px] leading-relaxed max-w-[540px] mb-14"
                style={{ color: "rgba(255,255,255,0.5)" }}
            >
                Bias in hiring is not always intentional. It is structural, statistical, and systematic — and it is costing companies talent, money, and trust.
            </motion.p>

            <motion.div
                variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {cards.map(({ icon, title, text, c, cbg, cb }, i) => (
                    <motion.div key={title} variants={fadeUp} custom={i * 0.1}>
                        <TiltCard
                            className="h-full rounded-[22px] p-8 relative overflow-hidden cursor-default transition-all duration-300 border"
                            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" }}
                        >
                            <motion.div
                                className="absolute inset-0 rounded-[22px]"
                                style={{ background: `radial-gradient(ellipse at top left, ${cbg}, transparent 60%)` }}
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                            <motion.div
                                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]"
                                style={{ background: c }}
                                initial={{ scaleX: 0 }}
                                whileHover={{ scaleX: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-[26px] mb-5 border relative z-10"
                                style={{ background: cbg, borderColor: cb }}
                            >
                                {icon}
                            </div>
                            <h3 className="text-white text-[19px] font-bold mb-3 relative z-10">{title}</h3>
                            <p className="text-[14.5px] leading-relaxed relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>{text}</p>
                        </TiltCard>
                    </motion.div>
                ))}
            </motion.div>

            <motion.blockquote
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.4}
                className="mt-14 rounded-r-2xl p-6 border-l-4"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: G.blue, border: "1px solid rgba(255,255,255,0.09)", borderLeft: `4px solid ${G.blue}` }}
            >
                <p className="text-[15.5px] leading-relaxed italic mb-2.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                    "Companies using algorithmic hiring tools are three times more likely to face EEOC investigation than those using traditional methods — yet 91% have never audited their tools for adverse impact."
                </p>
                <cite className="text-xs font-bold tracking-widest uppercase not-italic" style={{ color: "rgba(255,255,255,0.35)" }}>
                    — Harvard Business Review, 2024 AI in Hiring Report
                </cite>
            </motion.blockquote>
        </Section>
    );
}

// ─── SOLUTION ─────────────────────────────────────────────────────────────────
function Solution() {
    const features = [
        { icon: "📐", title: "Adverse Impact Ratio", text: "Calculates EEOC 80% Rule violations per protected group. Identifies which groups are hired at legally actionable rates.", tag: "EEOC Compliant", c: G.blue, bg: "rgba(26,115,232,0.08)", b: "rgba(26,115,232,0.2)" },
        { icon: "🔗", title: "Intersectional Analysis", text: "Detects compound bias at the intersection of gender × race, age × group identity. Minority females are often hit hardest — EquiLens surfaces this.", tag: "Unique Feature", c: G.green, bg: "rgba(52,168,83,0.08)", b: "rgba(52,168,83,0.2)" },
        { icon: "🎂", title: "Age Discrimination Detection", text: "Groups age into meaningful bands and tests for ADEA violations using chi-square statistical significance.", tag: "ADEA Coverage", c: G.yellow, bg: "rgba(251,188,4,0.08)", b: "rgba(251,188,4,0.2)" },
        { icon: "🔄", title: "Fix Simulation Engine", text: "Toggle any recommended fix and watch the risk score update in real time. Before / after. No guessing.", tag: "Demo Ready", c: G.red, bg: "rgba(234,67,53,0.08)", b: "rgba(234,67,53,0.2)" },
        { icon: "📄", title: "Compliance PDF Reports", text: "Auto-generated 7-section PDF: executive summary, risk scores, findings, recommendations, and audit trail. Board-ready in one click.", tag: "Enterprise Ready", c: G.blue, bg: "rgba(26,115,232,0.08)", b: "rgba(26,115,232,0.2)" },
        { icon: "🎯", title: "Real-time Risk Scoring", text: "Single 0–100 compliance risk score calibrated against EEOC, EU AI Act, and Equal Pay Act thresholds. One number. Actionable immediately.", tag: "Legal Framework", c: G.green, bg: "rgba(52,168,83,0.08)", b: "rgba(52,168,83,0.2)" },
    ];

    return (
        <Section id="solution" bg="#0A0A1F">
            <Eyebrow color={G.lightGreen} bg="rgba(52,168,83,0.12)">Features</Eyebrow>
            <motion.h2
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-black text-white mb-4 tracking-tight"
                style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.5px" }}
            >
                EquiLens catches what<br />your reports miss
            </motion.h2>
            <motion.p
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
                className="text-[17.5px] leading-relaxed max-w-[540px] mb-14"
                style={{ color: "rgba(255,255,255,0.5)" }}
            >
                Every analysis is backed by established statistical methods — not black-box AI guesses.
            </motion.p>

            <motion.div
                variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
                {features.map(({ icon, title, text, tag, c, bg, b }, i) => (
                    <motion.div key={title} variants={fadeUp} custom={(i % 3) * 0.1}>
                        <TiltCard
                            className="h-full rounded-[22px] p-7 relative overflow-hidden cursor-default border transition-all duration-300"
                            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" }}
                        >
                            <motion.div
                                className="absolute inset-0 rounded-[22px]"
                                style={{ background: `radial-gradient(ellipse at top left, ${bg}, transparent 60%)` }}
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                            <motion.div
                                className="absolute top-0 left-0 right-0 h-[2px]"
                                style={{ background: `linear-gradient(90deg, ${c}, transparent)` }}
                                initial={{ scaleX: 0, originX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                            />
                            <div
                                className="w-14 h-14 rounded-[15px] flex items-center justify-center text-[25px] mb-5 border relative z-10"
                                style={{ background: bg, borderColor: b }}
                            >
                                {icon}
                            </div>
                            <h3 className="text-white text-[16.5px] font-bold mb-2 relative z-10">{title}</h3>
                            <p className="text-[13.5px] leading-relaxed mb-3.5 relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>{text}</p>
                            <motion.span
                                className="text-[11px] font-black uppercase tracking-widest relative z-10 inline-block"
                                style={{ color: c }}
                                whileHover={{ x: 3 }}
                            >
                                {tag} ↗
                            </motion.span>
                        </TiltCard>
                    </motion.div>
                ))}
            </motion.div>
        </Section>
    );
}

// ─── VIDEO ────────────────────────────────────────────────────────────────────
function VideoDemo() {
    const [playing, setPlaying] = useState(false);
    const vRef = useRef(null);

    const toggle = useCallback((e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!vRef.current) return;
        if (vRef.current.paused) {
            vRef.current.play();
        } else {
            vRef.current.pause();
        }
    }, []);

    return (
        <Section id="demo" bg={G.dim}>
            <div className="text-center mb-11">
                <Eyebrow color={G.lightBlue} bg="rgba(26,115,232,0.15)">Live Demo</Eyebrow>
                <motion.h2
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="font-black text-white mb-4 tracking-tight"
                    style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.5px" }}
                >
                    See EquiLens in Action
                </motion.h2>
                <motion.p
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
                    className="text-[17.5px] leading-relaxed max-w-[540px] mx-auto"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                >
                    Watch a real HR dataset go from Critical Risk (76/100) to Low Risk (28/100) in under 60 seconds.
                </motion.p>
            </div>

            <motion.div
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.2}
                className="relative rounded-3xl overflow-hidden"
                style={{
                    aspectRatio: "16/9",
                    background: G.navy,
                    boxShadow: `0 40px 120px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)`,
                }}
                whileHover={{ scale: 1.007 }}
            >
                {/* Rainbow border glow */}
                <div
                    className="absolute inset-0 rounded-3xl pointer-events-none z-10"
                    style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.1)` }}
                />

                <video
                    ref={vRef}
                    src="/optimized-video.mp4"
                    loop
                    controls
                    preload="metadata"
                    playsInline
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    className="w-full h-full object-cover relative z-0"
                />

                <AnimatePresence>
                    {!playing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggle}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-5 cursor-pointer z-20"
                            style={{ background: "rgba(8,8,26,0.55)", backdropFilter: "blur(2px)" }}
                        >
                            <motion.div
                                className="w-20 h-20 rounded-full flex items-center justify-center border-[3px] border-white/25"
                                style={{ background: "rgba(26,115,232,0.9)", boxShadow: `0 0 40px ${G.blue}80` }}
                                whileHover={{ scale: 1.12 }}
                                animate={{ boxShadow: [`0 0 20px ${G.blue}40`, `0 0 40px ${G.blue}80`, `0 0 20px ${G.blue}40`] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <div className="w-0 h-0 ml-2" style={{ borderStyle: "solid", borderWidth: "14px 0 14px 26px", borderColor: `transparent transparent transparent #fff` }} />
                            </motion.div>
                            <div
                                className="text-[14px] font-semibold px-5 py-2 rounded-full border"
                                style={{ color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.15)" }}
                            >
                                ▶  Watch Full Platform Demo — 2:45
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </Section>
    );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
    const steps = [
        { icon: "📁", title: "Upload HR Data",          text: "CSV directly to Google Cloud Storage via signed URL. Supports up to 100MB.", color: G.blue,   num: "01" },
        { icon: "🔍", title: "Statistical Detection",   text: "Python engine runs AIR, chi-square, proxy correlation — before any AI call.", color: G.green,  num: "02" },
        { icon: "🤖", title: "Vertex AI Analysis",      text: "Gemini 1.5 Pro interprets statistical evidence and generates plain-English findings.", color: G.yellow, num: "03" },
        { icon: "🔄", title: "Simulate Fixes",          text: "Toggle recommended fixes. Watch the risk score drop in real time.", color: G.red,   num: "04" },
        { icon: "📄", title: "Download Report",         text: "Board-ready compliance PDF with findings, evidence, and audit trail in one click.", color: G.blue,   num: "05" },
    ];

    return (
        <Section id="how" bg={G.navy}>
            <Eyebrow color={G.lightBlue} bg="rgba(26,115,232,0.12)">Pipeline</Eyebrow>
            <motion.h2
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-black text-white mb-4 tracking-tight"
                style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.5px" }}
            >
                How EquiLens Works
            </motion.h2>
            <motion.p
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
                className="text-[17.5px] leading-relaxed max-w-[480px] mb-16"
                style={{ color: "rgba(255,255,255,0.5)" }}
            >
                Five steps from raw HR CSV to a court-ready bias audit report.
            </motion.p>

            {/* SVG connecting line */}
            <div className="relative">
                <div className="hidden lg:block absolute top-9 left-[10%] right-[10%] h-px overflow-hidden">
                    <motion.div
                        className="h-full"
                        style={{ background: `linear-gradient(90deg, ${G.blue}, ${G.green}, ${G.yellow}, ${G.red}, ${G.blue})`, backgroundSize: "200% 100%" }}
                        initial={{ scaleX: 0, originX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    />
                </div>

                <motion.div
                    variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10"
                >
                    {steps.map(({ icon, title, text, color, num }, i) => (
                        <motion.div
                            key={num}
                            variants={fadeUp}
                            custom={i * 0.1}
                            className="flex flex-col items-center text-center"
                        >
                            <motion.div
                                className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] mb-5 cursor-default"
                                style={{ background: `${color}22` }}
                                whileHover={{ scale: 1.12, background: `${color}35` }}
                                transition={{ type: "spring", stiffness: 280 }}
                            >
                                {icon}
                                <div
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                                    style={{ background: color }}
                                >
                                    {i + 1}
                                </div>
                                {/* Pulse ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{ border: `1px solid ${color}` }}
                                    animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                                />
                            </motion.div>
                            <h3 className="text-white text-[14px] font-bold mb-1.5 leading-snug">{title}</h3>
                            <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{text}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </Section>
    );
}

// ─── ARCHITECTURE ─────────────────────────────────────────────────────────────
function Architecture() {
    const layers = [
        { badge: "Client Layer",       items: [{ icon: "⚛️", title: "React Frontend", sub: "Firebase Hosting · CDN · Global", color: G.blue }, { icon: "🔒", title: "Firebase Auth", sub: "JWT · Org Claims · Role-Based", color: "#FFA000" }] },
        { badge: "API Layer",          items: [{ icon: "🟢", title: "NestJS API", sub: "Cloud Run · REST · JWT Middleware", color: G.green }, { icon: "🗄️", title: "Firestore", sub: "Org-Scoped · Real-time · Rules", color: "#FFA000" }] },
        { badge: "Intelligence Layer", items: [{ icon: "🐍", title: "Python ML Engine", sub: "Cloud Run · FastAPI · Async Jobs", color: G.red }, { icon: "🪣", title: "Cloud Storage", sub: "CSV Uploads · PDF Reports · GCS", color: G.blue }] },
        { badge: "AI Layer",           items: [{ icon: "🤖", title: "Vertex AI", sub: "Gemini 1.5 Pro · Explainable AI", color: G.yellow }, { icon: "🔑", title: "Secret Manager", sub: "Credentials · Env Secrets", color: G.green }] },
    ];

    return (
        <Section id="architecture" bg={G.dark}>
            <Eyebrow color={G.lightRed} bg="rgba(234,67,53,0.12)">Architecture</Eyebrow>
            <motion.h2
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-black text-white mb-4 tracking-tight"
                style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.5px" }}
            >
                Built for Google Cloud,<br />End to End
            </motion.h2>
            <motion.p
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
                className="text-[17.5px] leading-relaxed max-w-[540px] mb-14"
                style={{ color: "rgba(255,255,255,0.5)" }}
            >
                Every layer is a managed Google service — no self-hosted infrastructure, no ops overhead.
            </motion.p>

            <div className="max-w-[720px] mx-auto">
                {layers.map((layer, ri) => (
                    <div key={layer.badge}>
                        {ri > 0 && (
                            <motion.div
                                className="flex items-center justify-center py-3.5"
                                initial={{ opacity: 0, scaleY: 0 }}
                                whileInView={{ opacity: 1, scaleY: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: ri * 0.15 }}
                            >
                                <div
                                    className="w-px h-10"
                                    style={{ background: `linear-gradient(180deg, ${G.blue}, ${G.green})` }}
                                />
                            </motion.div>
                        )}
                        <motion.div
                            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                            className="flex gap-4 justify-center"
                        >
                            {layer.items.map(({ icon, title, sub, color }, itemIndex) => (
                                <motion.div
                                    key={title}
                                    variants={fadeUp}
                                    className="relative flex-1 max-w-[220px] rounded-[18px] p-5 text-center border cursor-default"
                                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" }}
                                    whileHover={{ borderColor: color + "55", y: -4, boxShadow: `0 12px 36px rgba(0,0,0,0.3)` }}
                                >
                                    {itemIndex === 0 && (
                                        <div
                                            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap"
                                            style={{ background: color }}
                                        >
                                            {layer.badge}
                                        </div>
                                    )}
                                    <div className="text-[32px] mb-2.5">{icon}</div>
                                    <h4 className="text-white text-[13.5px] font-bold mb-1">{title}</h4>
                                    <p className="text-[11.5px] leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>{sub}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ─── GOOGLE TECH ──────────────────────────────────────────────────────────────
function GoogleTech() {
    const techs = [
        { abbr: "VAI", name: "Vertex AI",      desc: "Gemini 1.5 Pro analysis and Explainable AI feature attribution", role: "Core Intelligence", c: G.blue,   bg: "rgba(26,115,232,0.1)" },
        { abbr: "CR",  name: "Cloud Run",      desc: "Serverless containers for NestJS API and Python ML backend",    role: "Compute Layer",     c: G.green,  bg: "rgba(52,168,83,0.1)" },
        { abbr: "FB",  name: "Firebase",       desc: "Hosting, Auth with custom claims, and Firestore database",     role: "Frontend + Auth",   c: "#FFA000", bg: "rgba(255,160,0,0.1)" },
        { abbr: "FS",  name: "Firestore",      desc: "Org-scoped real-time database for job status and results",     role: "Data Persistence",  c: "#FFA000", bg: "rgba(255,160,0,0.1)" },
        { abbr: "GCS", name: "Cloud Storage",  desc: "Secure CSV upload bucket and PDF report storage with signed URLs", role: "File Storage",  c: G.blue,   bg: "rgba(26,115,232,0.1)" },
        { abbr: "CB",  name: "Cloud Build",    desc: "CI/CD pipeline auto-deploying on every GitHub push to main",  role: "DevOps",            c: G.green,  bg: "rgba(52,168,83,0.1)" },
        { abbr: "SM",  name: "Secret Manager", desc: "All credentials and API keys stored and injected securely",   role: "Security",          c: G.red,    bg: "rgba(234,67,53,0.1)" },
        { abbr: "CM",  name: "Cloud Monitor",  desc: "Uptime checks, error alerts, latency dashboards and budget caps", role: "Observability", c: G.yellow, bg: "rgba(251,188,4,0.1)" },
    ];

    return (
        <Section id="tech" bg={G.navy}>
            <Eyebrow color={G.lightBlue} bg="rgba(26,115,232,0.15)">Technology</Eyebrow>
            <motion.h2
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="font-black text-white mb-4 tracking-tight"
                style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.5px" }}
            >
                Built With Google,<br />Through and Through
            </motion.h2>
            <motion.p
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
                className="text-[17.5px] leading-relaxed max-w-[540px] mb-14"
                style={{ color: "rgba(255,255,255,0.5)" }}
            >
                Eight Google Cloud services working as one — not bolted together but designed as a native stack from the start.
            </motion.p>

            <motion.div
                variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {techs.map(({ abbr, name, desc, role, c, bg }, i) => (
                    <motion.div
                        key={name}
                        variants={fadeUp}
                        custom={(i % 4) * 0.1}
                        className="rounded-[18px] p-6 text-center border relative overflow-hidden cursor-default"
                        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)" }}
                        whileHover={{ borderColor: c + "55", y: -5, boxShadow: `0 18px 45px rgba(0,0,0,0.3)` }}
                    >
                        {/* Shimmer on hover */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)", left: "-120%" }}
                            whileHover={{ left: "140%" }}
                            transition={{ duration: 0.45 }}
                        />
                        <div
                            className="w-14 h-14 rounded-2xl mx-auto mb-3.5 flex items-center justify-center text-[14px] font-black tracking-tight"
                            style={{ background: bg, color: c }}
                        >
                            {abbr}
                        </div>
                        <h4 className="text-white text-[14px] font-bold mb-1.5">{name}</h4>
                        <p className="text-[12px] leading-relaxed mb-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
                        <span className="text-[10.5px] font-black uppercase tracking-widest" style={{ color: c }}>{role}</span>
                    </motion.div>
                ))}
            </motion.div>
        </Section>
    );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
    return (
        <section
            className="py-28 lg:py-36 px-6 lg:px-12 text-center relative overflow-hidden"
            style={{ background: G.navy }}
        >
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(26,115,232,0.28), transparent 65%)` }}
            />
            <GridBg />
            <Particles count={14} />

            <div className="relative z-10 max-w-[680px] mx-auto">
                <motion.div
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    <motion.h2
                        className="font-black text-white mb-4 leading-tight tracking-tight"
                        style={{ fontSize: "clamp(34px,5vw,54px)", letterSpacing: "-0.5px" }}
                    >
                        Ready to Audit<br />
                        <span style={{
                            background: `linear-gradient(135deg, ${G.blue} 0%, ${G.green} 45%, ${G.yellow} 100%)`,
                            backgroundSize: "200% 200%",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            animation: "gradShift 5s ease infinite",
                        }}>
              Your HR Data?
            </span>
                    </motion.h2>
                    <p className="text-[18px] leading-relaxed mb-11" style={{ color: "rgba(255,255,255,0.55)" }}>
                        Upload a CSV. Get a compliance risk score in 30 seconds. No credit card. No setup. Just answers.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap items-center mb-8">
                        <PrimaryBtn href="#demo" style={{ fontSize: 17, padding: "16px 40px" }}>
                            Start Free Audit →
                        </PrimaryBtn>
                        <motion.a
                            href="#architecture"
                            className="no-underline font-semibold text-[16px] px-7 py-4 rounded-[14px] border"
                            style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" }}
                            whileHover={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                        >
                            View Architecture
                        </motion.a>
                    </div>

                    {/* Disclaimer */}
                    <div className="max-w-[500px] mx-auto mb-6 p-4 rounded-xl border text-left" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(26,115,232,0.3)", borderLeft: `3px solid ${G.blue}` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[18px]">⏱️</span>
                            <span className="text-[14px] font-bold text-white">Processing Time Expectation</span>
                        </div>
                        <p className="text-[13px] leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                            The Bias Audit engine takes up to <strong>1-2 minutes</strong> to Audit the dataset.
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                            The Mitigation ML model takes up to <strong>1 minute</strong> to mitigate / fix the dataset.
                        </p>
                    </div>

                    <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.28)" }}>
                        Built for the Google Solution Challenge 2026 · Firebase + Vertex AI + Cloud Run
                    </p>
                </motion.div>
            </div>
        </section>
    );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
    return (
        <footer className="pt-16 pb-10 px-6 lg:px-12 border-t border-white/6" style={{ background: G.dim }}>
            <div className="max-w-[1200px] mx-auto">
                <div className="flex flex-col lg:flex-row justify-between gap-12 mb-14">
                    <div className="max-w-[300px]">
                        <div className="flex items-center gap-2.5 mb-3.5">
                            <div
                                className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[14px] font-black text-white"
                                style={{ background: `linear-gradient(135deg, ${G.blue}, ${G.green})` }}
                            >
                                EL
                            </div>
                            <span className="text-[18px] font-extrabold text-white">EquiLens</span>
                        </div>
                        <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                            Bias detection and compliance for the AI age. Built on Google Cloud. Trusted by compliance teams.
                        </p>
                    </div>
                    <div className="flex gap-16 flex-wrap">
                        {[
                            { title: "Product", links: ["Features", "Demo", "Pricing", "Enterprise"] },
                            { title: "Developers", links: ["Architecture", "API Docs", "GitHub", "Cloud Build"] },
                            { title: "Company",  links: ["About", "Blog", "Privacy", "Terms"] },
                        ].map(({ title, links }) => (
                            <div key={title}>
                                <h5 className="text-[11.5px] font-black uppercase tracking-[1.1px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                                    {title}
                                </h5>
                                <ul className="list-none space-y-2.5">
                                    {links.map((l) => (
                                        <li key={l}>
                                            <motion.a
                                                href="#"
                                                className="no-underline text-[14px]"
                                                style={{ color: "rgba(255,255,255,0.4)" }}
                                                whileHover={{ color: "#fff" }}
                                            >
                                                {l}
                                            </motion.a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-3.5 pt-7 border-t border-white/7">
          <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2026 EquiLens · Google Solution Challenge Top 100
          </span>
                    <div className="flex gap-2.5">
                        {["EEOC Compliant", "EU AI Act", "ADEA"].map((b) => (
                            <motion.span
                                key={b}
                                className="text-[11px] font-bold px-3.5 py-1 rounded-full border"
                                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.35)" }}
                                whileHover={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
                            >
                                {b}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function EquiLensLanding() {
    const [navScrolled, setNavScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setNavScrolled(window.scrollY > 60);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className="font-sans antialiased" style={{ color: "#0A0A14", background: "#fff" }}>
            <SEO title="EquiLens - Stop Hiring Bias" />
            <style>{`html { scroll-behavior: smooth; }`}</style>
            <ScrollSVGPath />
            <Nav scrolled={navScrolled} />
            <Hero />
            <StatsBar />
            <VideoDemo />
            <Problem />
            <Solution />
            <HowItWorks />
            <Architecture />
            <GoogleTech />
            <CTA />
        </div>
    );
}