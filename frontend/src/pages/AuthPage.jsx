import React, { useState, useEffect } from 'react';
import { InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

/* ─── Google Brand Tokens ──────────────────────────────────────────── */
const G = {
    blue:   '#4285F4',
    red:    '#EA4335',
    yellow: '#FBBC05',
    green:  '#34A853',
    dark:   '#0D0D14',
    card:   'rgba(20, 20, 32, 0.85)',
    border: 'rgba(255,255,255,0.08)',
    muted:  'rgba(255,255,255,0.45)',
    text:   '#F0F0F8',
};

/* ─── Keyframe injection ────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    min-height: 100vh;
    display: flex;
    background: ${G.dark};
    font-family: 'Inter', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* ── Left brand panel ── */
  .brand-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 48px;
    position: relative;
    overflow: hidden;
  }
  .brand-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 80% at 50% 50%, rgba(66,133,244,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Animated orbs ── */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(48px);
    will-change: transform;
    mix-blend-mode: screen;
  }
  .orb-1 { width: 340px; height: 340px; background: ${G.blue};   opacity: 0.22; top: -80px; left: -80px; animation: floatA 9s ease-in-out infinite; }
  .orb-2 { width: 260px; height: 260px; background: ${G.red};    opacity: 0.20; bottom: 10%; right: -60px; animation: floatB 11s ease-in-out infinite; }
  .orb-3 { width: 200px; height: 200px; background: ${G.yellow}; opacity: 0.18; bottom: -40px; left: 20%; animation: floatC 8s ease-in-out infinite; }
  .orb-4 { width: 180px; height: 180px; background: ${G.green};  opacity: 0.20; top: 30%; right: 10%; animation: floatD 13s ease-in-out infinite; }
  .orb-5 { width: 120px; height: 120px; background: ${G.blue};   opacity: 0.15; top: 55%; left: 8%; animation: floatE 7s ease-in-out infinite; }

  @keyframes floatA { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(40px,50px) scale(1.08)} }
  @keyframes floatB { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(-35px,-45px) scale(1.06)} }
  @keyframes floatC { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(25px,-30px) scale(1.1)} }
  @keyframes floatD { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(-20px,40px) scale(0.95)} }
  @keyframes floatE { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(30px,-20px) scale(1.12)} }

  /* ── Google dots logo ── */
  .g-logo {
    display: flex;
    gap: 10px;
    margin-bottom: 32px;
    position: relative;
    z-index: 1;
  }
  .g-dot {
    width: 16px; height: 16px;
    border-radius: 50%;
    animation: pulseDot 2.4s ease-in-out infinite;
  }
  .g-dot:nth-child(1) { background: ${G.blue};   animation-delay: 0s; }
  .g-dot:nth-child(2) { background: ${G.red};    animation-delay: 0.2s; }
  .g-dot:nth-child(3) { background: ${G.yellow}; animation-delay: 0.4s; }
  .g-dot:nth-child(4) { background: ${G.green};  animation-delay: 0.6s; }
  @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.4);opacity:1} }

  .brand-title {
    font-size: clamp(2.8rem, 4.5vw, 4rem);
    font-weight: 900;
    letter-spacing: -2px;
    color: ${G.text};
    text-align: center;
    line-height: 1.05;
    position: relative;
    z-index: 1;
  }
  .brand-title span { background: linear-gradient(90deg, ${G.blue}, ${G.green}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .brand-sub {
    margin-top: 16px;
    font-size: 1.05rem;
    color: ${G.muted};
    text-align: center;
    max-width: 320px;
    line-height: 1.6;
    position: relative;
    z-index: 1;
  }

  /* ── Feature pills ── */
  .feature-pills { display: flex; flex-direction: column; gap: 12px; margin-top: 40px; position: relative; z-index: 1; }
  .pill {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 50px;
    padding: 10px 20px;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.75);
    backdrop-filter: blur(8px);
  }
  .pill-icon { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* ── Right form panel ── */
  .form-panel {
    width: 480px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    position: relative;
    background: rgba(13,13,20,0.6);
    backdrop-filter: blur(20px);
    border-left: 1px solid ${G.border};
  }

  /* ── Card ── */
  .auth-card {
    width: 100%;
    max-width: 400px;
    position: relative;
  }

  /* ── Rainbow border animation ── */
  .card-border-wrap {
    position: relative;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(135deg, ${G.blue}, ${G.red}, ${G.yellow}, ${G.green}, ${G.blue});
    background-size: 300% 300%;
    animation: gradientShift 5s ease infinite;
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .card-inner {
    background: ${G.card};
    border-radius: 22px;
    padding: 40px 36px;
    backdrop-filter: blur(24px);
  }

  /* ── Mode tabs ── */
  .mode-tabs {
    display: flex;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 32px;
    position: relative;
  }
  .tab-btn {
    flex: 1; border: none; background: transparent; cursor: pointer;
    padding: 10px; border-radius: 10px; font-family: 'Inter', sans-serif;
    font-size: 0.9rem; font-weight: 600; color: ${G.muted};
    transition: color 0.2s; position: relative; z-index: 1;
  }
  .tab-btn.active { color: ${G.text}; }
  .tab-slider {
    position: absolute;
    top: 4px; bottom: 4px;
    width: calc(50% - 4px);
    border-radius: 9px;
    background: rgba(66,133,244,0.25);
    border: 1px solid rgba(66,133,244,0.4);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    left: 4px;
  }
  .tab-slider.signup { transform: translateX(calc(100% + 0px)); }

  /* ── Form heading ── */
  .form-heading { font-size: 1.6rem; font-weight: 800; color: ${G.text}; margin-bottom: 6px; letter-spacing: -0.5px; }
  .form-sub { font-size: 0.875rem; color: ${G.muted}; margin-bottom: 28px; }

  /* ── Inputs ── */
  .field-wrap { margin-bottom: 16px; }
  .field-label { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 6px; display: block; letter-spacing: 0.3px; text-transform: uppercase; }
  .field-input-wrap { position: relative; }
  .field-input {
    width: 100%; background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 14px 16px;
    font-size: 0.95rem; font-family: 'Inter', sans-serif;
    color: ${G.text}; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .field-input::placeholder { color: rgba(255,255,255,0.25); }
  .field-input:focus {
    border-color: ${G.blue};
    background: rgba(66,133,244,0.07);
    box-shadow: 0 0 0 4px rgba(66,133,244,0.15);
  }
  .field-input.has-action { padding-right: 48px; }
  .field-action {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: ${G.muted};
    display: flex; align-items: center; padding: 4px;
    transition: color 0.15s;
  }
  .field-action:hover { color: ${G.text}; }

  /* ── Error ── */
  .error-box {
    background: rgba(234,67,53,0.12);
    border: 1px solid rgba(234,67,53,0.3);
    border-radius: 10px; padding: 10px 14px;
    color: #ff8a80; font-size: 0.85rem;
    margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }

  /* ── Submit button ── */
  .submit-btn {
    width: 100%; padding: 15px; border: none; border-radius: 12px;
    font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 700;
    cursor: pointer; position: relative; overflow: hidden;
    background: linear-gradient(135deg, ${G.blue} 0%, #1a73e8 100%);
    color: #fff; margin-bottom: 20px;
    transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
    letter-spacing: 0.2px;
  }
  .submit-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(66,133,244,0.45);
  }
  .submit-btn:not(:disabled):active { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .submit-btn .shimmer {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    animation: shimmer 2.2s ease-in-out infinite;
  }
  @keyframes shimmer { 0%{left:-100%} 100%{left:200%} }

  /* ── Divider ── */
  .or-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .or-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
  .or-text { font-size: 0.75rem; color: ${G.muted}; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }

  /* ── Google sign-in ── */
  .google-btn {
    width: 100%; padding: 14px; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.12);
    color: ${G.text}; margin-bottom: 24px;
    transition: background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .google-btn:not(:disabled):hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.25);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  }
  .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Footer link ── */
  .footer-text { text-align: center; font-size: 0.85rem; color: ${G.muted}; }
  .footer-link { background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 700; color: ${G.blue}; padding: 0; transition: color 0.15s; }
  .footer-link:hover { color: #7baff8; text-decoration: underline; }

  /* ── Shake on error ── */
  @keyframes shake {
    0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
  }
  .shake { animation: shake 0.45s ease; }

  /* ── Responsive ── */
  @media (max-width: 820px) {
    .auth-root { flex-direction: column; }
    .brand-panel { min-height: 220px; padding: 40px 24px 32px; }
    .brand-title { font-size: 2.2rem; }
    .feature-pills { display: none; }
    .orb-1 { width: 200px; height: 200px; }
    .orb-2 { width: 150px; height: 150px; }
    .form-panel {
      width: 100%; min-height: auto;
      border-left: none;
      border-top: 1px solid ${G.border};
      padding: 32px 20px 48px;
    }
  }
  @media (max-width: 400px) {
    .card-inner { padding: 28px 20px; }
    .brand-panel { padding: 32px 16px 24px; }
  }

  /* ── Loading spinner ── */
  .spinner {
    width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── Google SVG icon ───────────────────────────────────────────────── */
function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 16.2 3 9.5 7.9 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 45c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.4C29.7 35.8 27 37 24 37c-5.8 0-10.7-3.9-12.4-9.3l-7 5.4C8 40.3 15.4 45 24 45z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.5-2.4 4.6-4.6 6l6.6 5.4C41.6 36.5 44.5 31 44.5 24c0-1.3-.2-2.7-.5-4z"/>
        </svg>
    );
}

/* ─── Feature pills data ─────────────────────────────────────────────── */
const FEATURES = [
    { color: G.blue,   label: 'Real-time equity analysis' },
    { color: G.green,  label: 'AI-powered insights' },
    { color: G.yellow, label: 'Portfolio risk tracking' },
];

/* ─── Main component ─────────────────────────────────────────────────── */
export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail]     = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]     = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shakeKey, setShakeKey] = useState(0);

    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const toggleMode = () => {
        setIsLogin(v => !v);
        setError('');
        setEmail('');
        setPassword('');
    };

    const triggerShake = () => setShakeKey(k => k + 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) await signInWithEmail(email, password);
            else         await signUpWithEmail(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
            triggerShake();
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
            navigate('/');
        } catch (err) {
            setError(err.message || 'Google sign-in failed.');
            triggerShake();
        } finally {
            setIsLoading(false);
        }
    };

    /* Stagger animation variants */
    const formVariants = {
        hidden: { opacity: 0, x: 40 },
        show:   { opacity: 1, x: 0, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
    };

    return (
        <>
            <SEO title="EquiLens - Sign In" />
            <style>{STYLES}</style>

            <div className="auth-root">
                {/* ── Left brand panel ── */}
                <motion.div
                    className="brand-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                    <div className="orb orb-4" />
                    <div className="orb orb-5" />

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <div className="g-logo">
                            <div className="g-dot" /><div className="g-dot" /><div className="g-dot" /><div className="g-dot" />
                        </div>
                    </motion.div>

                    <motion.h1
                        className="brand-title"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.7, type: 'spring', stiffness: 90 }}
                    >
                        Equi<span>Lens</span>
                    </motion.h1>

                    <motion.p
                        className="brand-sub"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.65 }}
                    >
                        Institutional-grade equity analysis, now in your hands.
                    </motion.p>

                    <motion.div
                        className="feature-pills"
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: {},
                            show: { transition: { staggerChildren: 0.12, delayChildren: 0.8 } }
                        }}
                    >
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                className="pill"
                                variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                            >
                                <span className="pill-icon" style={{ background: f.color, boxShadow: `0 0 8px ${f.color}` }} />
                                {f.label}
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* ── Right form panel ── */}
                <div className="form-panel">
                    <motion.div
                        className="auth-card"
                        initial={{ opacity: 0, x: 60, scale: 0.97 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.2 }}
                    >
                        <div className="card-border-wrap">
                            <div className="card-inner">

                                {/* ── Mode tabs ── */}
                                <div className="mode-tabs">
                                    <div className={`tab-slider ${isLogin ? '' : 'signup'}`} />
                                    <button className={`tab-btn ${isLogin ? 'active' : ''}`} onClick={() => { if (!isLogin) toggleMode(); }}>
                                        Sign In
                                    </button>
                                    <button className={`tab-btn ${!isLogin ? 'active' : ''}`} onClick={() => { if (isLogin) toggleMode(); }}>
                                        Sign Up
                                    </button>
                                </div>

                                {/* ── Animated form content ── */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isLogin ? 'login' : 'signup'}
                                        variants={formVariants}
                                        initial="hidden"
                                        animate="show"
                                        exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                                    >
                                        <motion.div variants={itemVariants}>
                                            <p className="form-heading">{isLogin ? 'Welcome back' : 'Create account'}</p>
                                            <p className="form-sub">{isLogin ? 'Sign in to your EquiLens workspace' : 'Start analyzing smarter today'}</p>
                                        </motion.div>

                                        {/* ── Email field ── */}
                                        <motion.div variants={itemVariants} className="field-wrap">
                                            <label className="field-label" htmlFor="eq-email">Email</label>
                                            <div className="field-input-wrap">
                                                <input
                                                    id="eq-email"
                                                    className="field-input"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    required
                                                    autoComplete="email"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* ── Password field ── */}
                                        <motion.div variants={itemVariants} className="field-wrap" style={{ marginBottom: 24 }}>
                                            <label className="field-label" htmlFor="eq-pass">Password</label>
                                            <div className="field-input-wrap">
                                                <input
                                                    id="eq-pass"
                                                    className="field-input has-action"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Min. 8 characters"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    required
                                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                                />
                                                <button
                                                    type="button"
                                                    className="field-action"
                                                    onClick={() => setShowPassword(v => !v)}
                                                    tabIndex={-1}
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showPassword
                                                        ? <VisibilityOff style={{ fontSize: 20 }} />
                                                        : <Visibility style={{ fontSize: 20 }} />}
                                                </button>
                                            </div>
                                        </motion.div>

                                        {/* ── Error ── */}
                                        <AnimatePresence>
                                            {error && (
                                                <motion.div
                                                    key={shakeKey}
                                                    className="error-box"
                                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                    style={{ animation: `shake 0.45s ease, fadeIn 0.2s ease` }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                                        <circle cx="12" cy="12" r="10" stroke="#EA4335" strokeWidth="2"/>
                                                        <path d="M12 7v6M12 16v1" stroke="#EA4335" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    {error}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* ── Submit ── */}
                                        <motion.div variants={itemVariants}>
                                            <button
                                                className="submit-btn"
                                                onClick={handleSubmit}
                                                disabled={isLoading}
                                                type="button"
                                            >
                                                <span className="shimmer" />
                                                {isLoading
                                                    ? <span className="spinner" />
                                                    : (isLogin ? 'Sign In' : 'Create Account')}
                                            </button>
                                        </motion.div>

                                        {/* ── OR ── */}
                                        <motion.div variants={itemVariants} className="or-row">
                                            <div className="or-line" /><span className="or-text">or</span><div className="or-line" />
                                        </motion.div>

                                        {/* ── Google ── */}
                                        <motion.div variants={itemVariants}>
                                            <button className="google-btn" onClick={handleGoogleSignIn} disabled={isLoading} type="button">
                                                <GoogleIcon />
                                                Continue with Google
                                            </button>
                                        </motion.div>

                                        {/* ── Footer ── */}
                                        <motion.div variants={itemVariants} className="footer-text">
                                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                                            <button className="footer-link" onClick={toggleMode}>
                                                {isLogin ? 'Sign Up' : 'Sign In'}
                                            </button>
                                        </motion.div>

                                    </motion.div>
                                </AnimatePresence>

                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}