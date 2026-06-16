import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

/* ─── Google Brand Tokens (shared with AuthPage) ─────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .prof-root {
    min-height: 100vh;
    background: #0D0D14;
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 16px 64px;
    position: relative;
    overflow: hidden;
  }

  /* ── Ambient orbs ── */
  .p-orb { position: absolute; border-radius: 50%; filter: blur(70px); mix-blend-mode: screen; pointer-events: none; }
  .p-o1 { width: 500px; height: 500px; background: #4285F4; opacity: .10; top: -160px; right: -120px; animation: pfA 12s ease-in-out infinite; }
  .p-o2 { width: 360px; height: 360px; background: #34A853; opacity: .10; bottom: 0; left: -80px; animation: pfB 10s ease-in-out infinite; }
  .p-o3 { width: 260px; height: 260px; background: #EA4335; opacity: .09; top: 40%; left: 5%; animation: pfC 8s ease-in-out infinite; }
  .p-o4 { width: 200px; height: 200px; background: #FBBC05; opacity: .08; bottom: 15%; right: 5%; animation: pfD 14s ease-in-out infinite; }
  @keyframes pfA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,50px)} }
  @keyframes pfB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,-40px)} }
  @keyframes pfC { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,30px)} }
  @keyframes pfD { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,-30px)} }

  /* ── Page content ── */
  .prof-page { width: 100%; max-width: 680px; position: relative; z-index: 1; }

  /* ── Page header ── */
  .page-header { margin-bottom: 32px; }
  .page-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .eyebrow-dot { width: 8px; height: 8px; border-radius: 50%; background: #4285F4; box-shadow: 0 0 8px #4285F4; animation: pulseDot 2s ease-in-out infinite; }
  @keyframes pulseDot { 0%,100%{opacity:.8;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
  .eyebrow-text { font-size: .72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #4285F4; }
  .page-title { font-size: clamp(1.8rem,3.5vw,2.4rem); font-weight: 900; color: #F0F0F8; letter-spacing: -1px; }
  .page-subtitle { font-size: .9rem; color: rgba(255,255,255,.4); margin-top: 4px; }

  /* ── Card wrapper with rainbow border ── */
  .border-anim {
    border-radius: 22px;
    padding: 2px;
    background: linear-gradient(135deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4);
    background-size: 300% 300%;
    animation: gradShift 6s ease infinite;
    margin-bottom: 20px;
  }
  @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .card-inner {
    background: rgba(20,20,32,.90);
    border-radius: 20px;
    backdrop-filter: blur(24px);
    overflow: hidden;
  }

  /* ── Profile hero ── */
  .prof-hero {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 32px 36px 28px;
    border-bottom: 1px solid rgba(255,255,255,.07);
    position: relative;
    overflow: hidden;
  }
  .prof-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(66,133,244,.08) 0%, transparent 60%);
    pointer-events: none;
  }

  /* ── Avatar ── */
  .avatar-wrap { position: relative; flex-shrink: 0; }
  .avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,.12);
  }
  .avatar-initials {
    width: 80px; height: 80px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; font-weight: 800; color: #fff;
    position: relative;
    overflow: hidden;
  }
  .avatar-initials::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #4285F4 0%, #1a73e8 100%);
    animation: avatarPulse 3s ease-in-out infinite;
  }
  @keyframes avatarPulse { 0%,100%{opacity:1} 50%{opacity:.85} }
  .avatar-initials span { position: relative; z-index: 1; }
  .avatar-ring {
    position: absolute; inset: -4px;
    border-radius: 50%;
    border: 2px solid transparent;
    background: linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
    animation: ringRotate 4s linear infinite;
  }
  @keyframes ringRotate { to { transform: rotate(360deg); } }

  .hero-info { flex: 1; min-width: 0; }
  .hero-name { font-size: 1.35rem; font-weight: 800; color: #F0F0F8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hero-email { font-size: .85rem; color: rgba(255,255,255,.4); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(52,168,83,.12); border: 1px solid rgba(52,168,83,.3);
    border-radius: 20px; padding: 4px 12px; font-size: .72rem; font-weight: 600;
    color: #34A853; margin-top: 10px;
  }
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #34A853; box-shadow: 0 0 6px #34A853; animation: pulseDot 2s ease-in-out infinite; }

  /* ── Form section ── */
  .form-section { padding: 32px 36px; border-bottom: 1px solid rgba(255,255,255,.07); }
  .section-label {
    font-size: .7rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: rgba(255,255,255,.35); margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
  }
  .section-label::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.07); }

  /* ── Fields ── */
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .field-row.single { grid-template-columns: 1fr; }
  .field-wrap { display: flex; flex-direction: column; }
  .flabel { font-size: .72rem; font-weight: 600; color: rgba(255,255,255,.5); margin-bottom: 6px; letter-spacing: .3px; text-transform: uppercase; }
  .finput {
    background: rgba(255,255,255,.05); border: 1.5px solid rgba(255,255,255,.1);
    border-radius: 10px; padding: 12px 14px;
    font-size: .9rem; font-family: 'Inter', sans-serif;
    color: #F0F0F8; outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .finput::placeholder { color: rgba(255,255,255,.2); }
  .finput:focus { border-color: #4285F4; background: rgba(66,133,244,.07); box-shadow: 0 0 0 4px rgba(66,133,244,.12); }
  .finput:disabled { opacity: .45; cursor: not-allowed; }

  /* ── Save button ── */
  .save-btn {
    margin-top: 24px; width: 100%; padding: 14px; border: none; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: .95rem; font-weight: 700;
    cursor: pointer; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #4285F4 0%, #1a73e8 100%);
    color: #fff; transition: transform .15s, box-shadow .2s, opacity .2s;
    letter-spacing: .2px;
  }
  .save-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(66,133,244,.4); }
  .save-btn:not(:disabled):active { transform: translateY(0); }
  .save-btn:disabled { opacity: .55; cursor: not-allowed; }
  .save-btn .shim {
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
    animation: shim 2.4s ease-in-out infinite;
  }
  @keyframes shim { 0%{left:-100%} 100%{left:200%} }

  /* ── Sign out button ── */
  .signout-btn {
    padding: 10px 20px; border-radius: 9px; cursor: pointer;
    font-family: 'Inter', sans-serif; font-size: .85rem; font-weight: 600;
    background: rgba(255,255,255,.05); border: 1.5px solid rgba(255,255,255,.1);
    color: rgba(255,255,255,.6);
    transition: background .2s, border-color .2s, color .2s;
  }
  .signout-btn:hover { background: rgba(255,255,255,.09); border-color: rgba(255,255,255,.2); color: #F0F0F8; }

  /* ── Danger zone ── */
  .danger-section { padding: 28px 36px; }
  .danger-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .danger-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(234,67,53,.15); border: 1px solid rgba(234,67,53,.25);
    display: flex; align-items: center; justify-content: center;
  }
  .danger-title { font-size: .95rem; font-weight: 800; color: #EA4335; }
  .danger-desc { font-size: .82rem; color: rgba(255,255,255,.35); line-height: 1.6; margin-bottom: 16px; }
  .danger-btn {
    padding: 11px 22px; border-radius: 9px; cursor: pointer;
    font-family: 'Inter', sans-serif; font-size: .85rem; font-weight: 700;
    background: rgba(234,67,53,.1); border: 1.5px solid rgba(234,67,53,.3);
    color: #EA4335;
    transition: background .2s, border-color .2s, transform .15s, box-shadow .2s;
  }
  .danger-btn:hover { background: rgba(234,67,53,.18); border-color: rgba(234,67,53,.5); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(234,67,53,.2); }

  /* ── Success toast override ── */
  .swal2-popup { font-family: 'Inter', sans-serif !important; }

  /* ── Spinner ── */
  .spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; vertical-align: middle; }
  @keyframes spin { to{transform:rotate(360deg)} }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .prof-root { padding: 24px 12px 48px; }
    .prof-hero { flex-direction: column; text-align: center; padding: 24px 20px; }
    .form-section, .danger-section { padding: 24px 20px; }
    .field-row { grid-template-columns: 1fr; }
    .hero-badge { align-self: center; }
    .hero-name, .hero-email { white-space: normal; }
  }
`;

/* ─── Framer variants ────────────────────────────────────────────────── */
const pageVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { staggerChildren: .1, delayChildren: .05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 15 } },
};

/* ─── Main component ─────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({ displayName: '', email: '' });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/me');
        const data = response.data;
        setProfileData({ displayName: data.displayName || user.displayName || '', email: user.email || '' });
      } catch {
        setProfileData({ displayName: user.displayName || '', email: user.email || '' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(user, { displayName: profileData.displayName });
      await api.patch('/profile/me', { displayName: profileData.displayName });
      Swal.fire({ icon: 'success', title: 'Profile Updated', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message || 'An error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Delete your account?',
      text: "This action is permanent. All your data will be erased.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EA4335',
      cancelButtonColor: '#444',
      confirmButtonText: 'Yes, delete',
      background: '#1a1a2e',
      color: '#F0F0F8',
    });
    if (result.isConfirmed) {
      try {
        await api.delete('/profile/me');
        await signOut();
        Swal.fire({ title: 'Deleted!', text: 'Your account has been removed.', icon: 'success', background: '#1a1a2e', color: '#F0F0F8' });
        navigate('/');
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: error.response?.data?.message || error.message });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const initials = (profileData.displayName || profileData.email || '?').charAt(0).toUpperCase();

  /* ── Loading screen ── */
  if (loading) {
    return (
        <>
          <SEO title="EquiLens - Profile" />
          <style>{STYLES}</style>
          <div className="prof-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="p-orb p-o1" /><div className="p-orb p-o2" />
            <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['#4285F4','#EA4335','#FBBC05','#34A853'].map((c, i) => (
                      <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, animation: `pulseDot 1.5s ease-in-out ${i * .15}s infinite` }} />
                  ))}
                </div>
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', fontFamily: 'Inter, sans-serif' }}>Loading profile…</span>
              </div>
            </motion.div>
          </div>
        </>
    );
  }

  return (
      <>
        <SEO title="EquiLens - Profile" />
        <style>{STYLES}</style>

        <div className="prof-root">
          <div className="p-orb p-o1" />
          <div className="p-orb p-o2" />
          <div className="p-orb p-o3" />
          <div className="p-orb p-o4" />

          <motion.div
              className="prof-page"
              variants={pageVariants}
              initial="hidden"
              animate="show"
          >
            {/* ── Page header ── */}
            <motion.div variants={itemVariants} className="page-header">
              <div className="page-eyebrow">
                <div className="eyebrow-dot" />
                <span className="eyebrow-text">Account</span>
              </div>
              <h1 className="page-title">Your Profile</h1>
              <p className="page-subtitle">Manage your personal information and preferences</p>
            </motion.div>

            {/* ── Main card ── */}
            <motion.div variants={itemVariants} className="border-anim">
              <div className="card-inner">

                {/* ── Hero row ── */}
                <div className="prof-hero">
                  <div className="avatar-wrap">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="avatar" className="avatar" />
                    ) : (
                        <div className="avatar-initials">
                          <span>{initials}</span>
                        </div>
                    )}
                    <div className="avatar-ring" />
                  </div>
                  <div className="hero-info">
                    <div className="hero-name">{profileData.displayName || 'No name set'}</div>
                    <div className="hero-email">{profileData.email}</div>
                    <div className="hero-badge">
                      <span className="badge-dot" />
                      Active account
                    </div>
                  </div>
                  <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-section">
                    <div className="section-label">Personal Information</div>

                    <div className="field-row">
                      <div className="field-wrap">
                        <label className="flabel">Display Name</label>
                        <input
                            className="finput"
                            type="text"
                            name="displayName"
                            value={profileData.displayName}
                            onChange={handleChange}
                            placeholder="Your full name"
                            required
                        />
                      </div>
                      <div className="field-wrap">
                        <label className="flabel">Email Address</label>
                        <input
                            className="finput"
                            type="email"
                            value={profileData.email}
                            disabled
                            placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <button type="submit" className="save-btn" disabled={saving}>
                      <span className="shim" />
                      {saving ? <span className="spinner" /> : 'Save Changes'}
                    </button>
                  </div>
                </form>

                {/* ── Danger zone ── */}
                <div className="danger-section">
                  <div className="danger-header">
                    <div className="danger-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 9v4M12 16v1M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="danger-title">Danger Zone</span>
                  </div>
                  <p className="danger-desc">
                    Permanently delete your account and all associated data. This action cannot be undone and all your analysis history will be lost.
                  </p>
                  <button type="button" className="danger-btn" onClick={handleDeleteAccount}>
                    Delete Account
                  </button>
                </div>

              </div>
            </motion.div>

            {/* ── Google dots watermark ── */}
            <motion.div
                variants={itemVariants}
                style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, opacity: .4 }}
            >
              {['#4285F4','#EA4335','#FBBC05','#34A853'].map((c, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c, animation: `pulseDot 2.4s ease-in-out ${i*.2}s infinite` }} />
              ))}
            </motion.div>

          </motion.div>
        </div>
      </>
  );
}