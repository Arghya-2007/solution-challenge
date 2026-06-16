import { useState, useEffect } from 'react';
import { Drawer } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { checkHealth } from '../../api/equilens';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo';

/* ─── Shared style tokens ────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .nav-root {
    position: sticky;
    top: 0;
    z-index: 1200;
    font-family: 'Inter', sans-serif;
  }

  /* ── Bar ── */
  .nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 64px;
    background: rgba(13, 13, 20, 0.82);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,.07);
    position: relative;
  }

  /* ── Rainbow bottom line ── */
  .nav-bar::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(to right, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4);
    background-size: 200% 100%;
    animation: slideGrad 4s linear infinite;
  }
  @keyframes slideGrad { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }

  /* ── Left: logo ── */
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; text-decoration: none; flex-shrink: 0;
  }
  .logo-icon {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
  }
  .logo-text {
    font-size: 1.3rem; font-weight: 900; letter-spacing: -.5px;
    background: linear-gradient(90deg, #4285F4, #34A853);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  /* ── Center: nav tabs ── */
  .nav-tabs {
    display: flex; align-items: center; gap: 2px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 12px; padding: 4px;
  }
  .nav-tab {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 18px; border-radius: 9px; border: none;
    font-family: 'Inter', sans-serif; font-size: .88rem; font-weight: 600;
    cursor: pointer; transition: color .2s, background .2s;
    color: rgba(255,255,255,.4); background: transparent;
    position: relative; white-space: nowrap;
  }
  .nav-tab svg { width: 16px; height: 16px; flex-shrink: 0; }
  .nav-tab.active {
    background: rgba(66,133,244,.2);
    border: 1px solid rgba(66,133,244,.3);
    color: #F0F0F8;
  }
  .nav-tab:not(.active):hover { color: rgba(255,255,255,.75); background: rgba(255,255,255,.06); }

  /* ── Right: actions ── */
  .nav-actions { display: flex; align-items: center; gap: 10px; }

  /* ── Status chip ── */
  .status-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 20px;
    font-size: .72rem; font-weight: 700; letter-spacing: .3px;
    transition: all .3s;
  }
  .status-chip.online  { background: rgba(52,168,83,.12); border: 1px solid rgba(52,168,83,.28); color: #34A853; }
  .status-chip.offline { background: rgba(234,67,53,.12); border: 1px solid rgba(234,67,53,.28); color: #EA4335; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .status-chip.online  .status-dot { background: #34A853; box-shadow: 0 0 6px #34A853; animation: blink 2s ease-in-out infinite; }
  .status-chip.offline .status-dot { background: #EA4335; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }

  /* ── Nav action buttons ── */
  .nav-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 9px;
    font-family: 'Inter', sans-serif; font-size: .85rem; font-weight: 600;
    cursor: pointer; transition: background .2s, border-color .2s, transform .15s, box-shadow .2s;
    white-space: nowrap; border: 1.5px solid transparent;
  }
  .nav-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
  .nav-btn.profile {
    background: rgba(255,255,255,.06);
    border-color: rgba(255,255,255,.12); color: #F0F0F8;
  }
  .nav-btn.profile:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.22); transform: translateY(-1px); }
  .nav-btn.signout {
    background: rgba(234,67,53,.1);
    border-color: rgba(234,67,53,.25); color: #EA4335;
  }
  .nav-btn.signout:hover { background: rgba(234,67,53,.18); border-color: rgba(234,67,53,.45); transform: translateY(-1px); box-shadow: 0 3px 12px rgba(234,67,53,.2); }
  .nav-btn.signin {
    background: linear-gradient(135deg, #4285F4, #1a73e8);
    border-color: transparent; color: #fff;
    position: relative; overflow: hidden;
  }
  .nav-btn.signin::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
    animation: shim 2.4s ease-in-out infinite;
  }
  @keyframes shim { 0%{left:-100%} 100%{left:200%} }
  .nav-btn.signin:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(66,133,244,.4); }

  /* ── Avatar pill (user logged in) ── */
  .user-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 4px 4px 12px; border-radius: 50px;
    background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.1);
    font-family: 'Inter', sans-serif; font-size: .82rem; font-weight: 600;
    color: rgba(255,255,255,.7); cursor: pointer;
    transition: background .2s, border-color .2s;
  }
  .user-pill:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.2); }
  .user-avatar {
    width: 28px; height: 28px; border-radius: 50%; overflow: hidden;
    background: linear-gradient(135deg, #4285F4, #1a73e8);
    display: flex; align-items: center; justify-content: center;
    font-size: .75rem; font-weight: 800; color: #fff; flex-shrink: 0;
  }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; }

  /* ── Hamburger ── */
  .hamburger {
    display: none; flex-direction: column; justify-content: center; gap: 5px;
    width: 36px; height: 36px; padding: 6px; cursor: pointer;
    background: rgba(255,255,255,.05); border: 1.5px solid rgba(255,255,255,.1);
    border-radius: 8px; transition: background .2s;
  }
  .hamburger:hover { background: rgba(255,255,255,.1); }
  .hamburger span { display: block; height: 2px; width: 100%; background: rgba(255,255,255,.7); border-radius: 2px; transition: all .3s; }

  /* ── Mobile drawer ── */
  .drawer-content {
    width: 280px; min-height: 100vh;
    background: #0D0D14;
    border-right: 1px solid rgba(255,255,255,.08);
    display: flex; flex-direction: column;
    font-family: 'Inter', sans-serif;
  }
  .drawer-header {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .drawer-nav { padding: 12px; flex: 1; }
  .drawer-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 10px; cursor: pointer;
    font-size: .9rem; font-weight: 600; margin-bottom: 4px;
    transition: background .2s, color .2s; border: none;
    width: 100%; text-align: left; font-family: 'Inter', sans-serif;
    background: transparent; color: rgba(255,255,255,.45);
  }
  .drawer-item svg { width: 18px; height: 18px; flex-shrink: 0; }
  .drawer-item.active { background: rgba(66,133,244,.15); color: #F0F0F8; border: 1px solid rgba(66,133,244,.2); }
  .drawer-item:not(.active):hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); }
  .drawer-item.red { color: #EA4335; }
  .drawer-item.red:hover { background: rgba(234,67,53,.1); }
  .drawer-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,.07); }
  .drawer-gdots { display: flex; gap: 7px; justify-content: center; padding: 12px; }
  .gdot { width: 7px; height: 7px; border-radius: 50%; animation: pd 2.4s ease-in-out infinite; }
  @keyframes pd { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.5);opacity:1} }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .nav-bar { padding: 0 16px; }
    .nav-tabs { display: none; }
    .hamburger { display: flex; }
    .nav-actions .status-chip { display: none; }
    .nav-actions .nav-btn,
    .nav-actions .user-pill { display: none; }
  }
  @media (max-width: 480px) {
    .status-chip { display: none !important; }
  }
`;

/* ─── SVG icons (no MUI dependency) ─────────────────────────────────── */
const Icons = {
    Balance: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="3" x2="12" y2="21"/><polyline points="3 9 12 3 21 9"/>
            <path d="M3 9l3 6a3 3 0 006 0l3-6M6 15H3M21 15h-3"/>
        </svg>
    ),
    Upload: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
        </svg>
    ),
    Results: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
    ),
    History: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="12 8 12 12 14 14"/>
            <path d="M3.05 11a9 9 0 1 0 .5-4.5L1 4"/>
            <polyline points="1 4 1 8 5 8"/>
        </svg>
    ),
    User: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>
    ),
    Logout: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
    ),
    Login: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
    ),
    Migration: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    ),
};

const NAV_ITEMS = [
    { label: 'Upload',  path: '/',        Icon: Icons.Upload  },
    { label: 'Results', path: '/analyze', Icon: Icons.Results },
    { label: 'Migration', path: '/migration', Icon: Icons.Migration },
    { label: 'History', path: '/history', Icon: Icons.History },
];

/* ─── Main component ─────────────────────────────────────────────────── */
export default function Navbar() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { user, signOut } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [serverStatus, setServerStatus] = useState('offline');

    useEffect(() => {
        checkHealth()
            .then(() => setServerStatus('online'))
            .catch(() => setServerStatus('offline'));
    }, []);

    const handleNavClick = (path, label) => {
        if (label === 'Results' && sessionStorage.getItem('hasUploaded') !== 'true') {
            Swal.fire({
                icon: 'info',
                title: 'Upload Required',
                text: 'Please upload a file to continue.',
                confirmButtonText: 'Got it',
                confirmButtonColor: '#4285F4',
                background: '#14141f',
                color: '#F0F0F8',
            });
            return;
        }
        navigate(path);
        setDrawerOpen(false);
    };

    const initials = (user?.displayName || user?.email || '?').charAt(0).toUpperCase();
    const isActive = (path) => location.pathname === path;

    return (
        <>
            <style>{STYLES}</style>

            {/* ── Main bar ── */}
            <motion.div
                className="nav-root"
                initial={{ y: -64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
                <div className="nav-bar">

                    {/* Logo */}
                    <div className="nav-logo" onClick={() => navigate('/')}>
                        <Logo width={32} height={32} />
                        <span className="logo-text">EquiLens</span>
                    </div>

                    {/* Center tabs */}
                    <nav className="nav-tabs">
                        {NAV_ITEMS.map(({ label, path, Icon }) => (
                            <motion.button
                                key={label}
                                className={`nav-tab ${isActive(path) ? 'active' : ''}`}
                                onClick={() => handleNavClick(path, label)}
                                whileTap={{ scale: 0.96 }}
                            >
                                <Icon />
                                {label}
                            </motion.button>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="nav-actions">
                        {/* Server status */}
                        <div className={`status-chip ${serverStatus}`}>
                            <span className="status-dot" />
                            {serverStatus === 'online' ? 'Server Running' : 'Server Starting'}
                        </div>

                        {user ? (
                            <>
                                <motion.div
                                    className="user-pill"
                                    onClick={() => navigate('/profile')}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <span style={{ fontSize: '.78rem' }}>{user.displayName?.split(' ')[0] || 'Account'}</span>
                                    <div className="user-avatar">
                                        {user.photoURL
                                            ? <img src={user.photoURL} alt="avatar" />
                                            : initials}
                                    </div>
                                </motion.div>
                                <motion.button
                                    className="nav-btn signout"
                                    onClick={signOut}
                                    whileTap={{ scale: 0.96 }}
                                >
                                    <Icons.Logout />
                                    Sign out
                                </motion.button>
                            </>
                        ) : (
                            <motion.button
                                className="nav-btn signin"
                                onClick={() => navigate('/auth')}
                                whileTap={{ scale: 0.96 }}
                            >
                                <Icons.Login />
                                Sign In
                            </motion.button>
                        )}

                        {/* Hamburger */}
                        <motion.button
                            className="hamburger"
                            onClick={() => setDrawerOpen(true)}
                            whileTap={{ scale: 0.93 }}
                            aria-label="Open menu"
                        >
                            <span /><span /><span />
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* ── Mobile drawer (MUI for accessibility overlay) ── */}
            <Drawer
                variant="temporary"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { background: 'transparent', border: 'none', boxShadow: 'none' },
                    '& .MuiBackdrop-root': { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,.5)' },
                }}
            >
                <motion.div
                    className="drawer-content"
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                >
                    {/* Drawer header */}
                    <div className="drawer-header">
                        <Logo width={28} height={28} />
                        <span className="logo-text">EquiLens</span>
                        <div style={{ marginLeft: 'auto' }}>
                            <div className={`status-chip ${serverStatus}`} style={{ display: 'flex' }}>
                                <span className="status-dot" />
                                {serverStatus === 'online' ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>

                    {/* Nav items */}
                    <div className="drawer-nav">
                        <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', padding: '4px 14px 10px' }}>
                            Navigation
                        </div>
                        {NAV_ITEMS.map(({ label, path, Icon }, i) => (
                            <motion.button
                                key={label}
                                className={`drawer-item ${isActive(path) ? 'active' : ''}`}
                                onClick={() => handleNavClick(path, label)}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * .07 }}
                                whileTap={{ scale: .97 }}
                            >
                                <Icon />
                                {label}
                            </motion.button>
                        ))}

                        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '10px 4px' }} />
                        <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', padding: '4px 14px 10px' }}>
                            Account
                        </div>

                        {user ? (
                            <>
                                {/* User profile row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 14px' }}>
                                    <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '.9rem' }}>
                                        {user.photoURL ? <img src={user.photoURL} alt="avatar" /> : initials}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#F0F0F8' }}>{user.displayName || 'User'}</div>
                                        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{user.email}</div>
                                    </div>
                                </div>
                                <motion.button
                                    className="drawer-item"
                                    onClick={() => { navigate('/profile'); setDrawerOpen(false); }}
                                    whileTap={{ scale: .97 }}
                                >
                                    <Icons.User />
                                    Profile
                                </motion.button>
                                <motion.button
                                    className="drawer-item red"
                                    onClick={() => { signOut(); setDrawerOpen(false); }}
                                    whileTap={{ scale: .97 }}
                                >
                                    <Icons.Logout />
                                    Sign out
                                </motion.button>
                            </>
                        ) : (
                            <motion.button
                                className="drawer-item active"
                                onClick={() => { navigate('/auth'); setDrawerOpen(false); }}
                                whileTap={{ scale: .97 }}
                            >
                                <Icons.Login />
                                Sign In
                            </motion.button>
                        )}
                    </div>

                    {/* Footer dots */}
                    <div className="drawer-footer">
                        <div className="drawer-gdots">
                            {['#4285F4','#EA4335','#FBBC05','#34A853'].map((c, i) => (
                                <div key={i} className="gdot" style={{ background: c, animationDelay: `${i * .18}s` }} />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </Drawer>
        </>
    );
}