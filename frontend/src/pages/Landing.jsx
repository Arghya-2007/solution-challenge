import React, { useState, useRef } from 'react';
import {
    Box,
    Container,
    Card,
    Typography,
    TextField,
    Button,
    InputAdornment,
    Snackbar,
    Alert,
    GlobalStyles
} from '@mui/material';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { uploadFile, uploadGoogleSheet } from '../api/equilens';

const headlineWords = [
    { text: 'Catch', color: '#4285F4' },
    { text: 'bias', color: '#EA4335' },
    { text: 'before', color: '#FBBC05' },
    { text: 'it', color: '#202124' },
    { text: 'catches', color: '#202124' },
    { text: 'someone.', color: '#34A853' },
];

const bgDecorVariants = {
    animate: {
        scale: [1, 1.2, 1.1, 1.3, 1],
        rotate: [0, 90, 180, 270, 360],
        borderRadius: ["40%", "60%", "30%", "50%", "40%"],
        transition: { duration: 25, repeat: Infinity, ease: 'easeInOut' }
    }
};

const templates = [
    {
        id: 'hiring',
        icon: <WorkIcon fontSize="large" sx={{ color: '#4285F4' }} />,
        title: 'Hiring & Recruitment',
        subtext: 'Detects gender & caste bias in shortlisting',
        color: '#4285F4',
        bg: 'rgba(66, 133, 244, 0.04)'
    },
    {
        id: 'loan',
        icon: <AccountBalanceIcon fontSize="large" sx={{ color: '#EA4335' }} />,
        title: 'Loan Approval',
        subtext: 'Detects religion & income bias in credit decisions',
        color: '#EA4335',
        bg: 'rgba(234, 67, 53, 0.04)'
    },
    {
        id: 'admissions',
        icon: <SchoolIcon fontSize="large" sx={{ color: '#34A853' }} />,
        title: 'College Admissions',
        subtext: 'Detects regional & socioeconomic bias in ranking',
        color: '#34A853',
        bg: 'rgba(52, 168, 83, 0.04)'
    }
];

const CustomCheckIcon = ({ size = 80, color = "#34A853" }) => (
    <motion.svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ marginBottom: 16, filter: `drop-shadow(0px 4px 12px ${color}80)` }}
        initial={{ pathLength: 0, opacity: 0, scale: 0.5 }}
        animate={{ pathLength: 1, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", type: "spring", bounce: 0.5 }}
    >
        <motion.path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <motion.polyline points="22 4 12 14.01 9 11.01" />
    </motion.svg>
);

export default function Landing() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [sheetUrl, setSheetUrl] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [error, setError] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleUploadClick = async () => {
        if (!file && !sheetUrl) return setError('Please provide a CSV file or Google Sheet URL.');

        setIsUploading(true);
        setUploadProgress(0);
        setUploadComplete(false);

        const SIMULATION_TIME = 3000;
        const intervalTime = 30;
        const steps = SIMULATION_TIME / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            setUploadProgress(Math.min((currentStep / steps) * 100, 100));

            if (currentStep >= steps) {
                clearInterval(timer);
                executeActualUpload();
            }
        }, intervalTime);
    };

    const executeActualUpload = async () => {
        try {
            let response;
            if (file) {
                response = await uploadFile(file);
            } else {
                response = await uploadGoogleSheet(sheetUrl);
            }
            setUploadComplete(true);
            setTimeout(() => {
                navigate('/analyze', { state: { data: response, template: selectedTemplate } });
            }, 1200);
        } catch (err) {
            setIsUploading(false);
            setError(err.message || 'Error uploading dataset.');
        }
    };

    return (
        <Box className="min-h-screen relative overflow-hidden flex flex-col pt-16 pb-12" sx={{ background: '#fcfcfc' }}>
            <GlobalStyles styles={{
                '@keyframes gradientFlow': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                '@keyframes borderSpin': {
                    '100%': { transform: 'rotate(360deg)' }
                },
                '@keyframes float': {
                    '0%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-15px)' },
                    '100%': { transform: 'translateY(0px)' }
                }
            }} />

            {/* Background Decorators */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none', filter: 'blur(80px)', willChange: 'transform' }}>
                <motion.div variants={bgDecorVariants} animate="animate" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'rgba(66,133,244,0.3)', willChange: 'transform' }} />
                <motion.div variants={bgDecorVariants} animate={{...bgDecorVariants.animate, transition: { duration: 28, repeat: Infinity, ease: 'easeInOut' }}} style={{ position: 'absolute', top: '10%', right: '-15%', width: '60vw', height: '60vw', background: 'rgba(234,67,53,0.2)', willChange: 'transform' }} />
                <motion.div variants={bgDecorVariants} animate={{...bgDecorVariants.animate, transition: { duration: 22, repeat: Infinity, ease: 'easeInOut' }}} style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '55vw', height: '55vw', background: 'rgba(251,188,5,0.2)', willChange: 'transform' }} />
                <motion.div variants={bgDecorVariants} animate={{...bgDecorVariants.animate, transition: { duration: 32, repeat: Infinity, ease: 'easeInOut' }}} style={{ position: 'absolute', bottom: '0%', right: '5%', width: '45vw', height: '45vw', background: 'rgba(52,168,83,0.2)', willChange: 'transform' }} />
            </Box>
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)' }} />

            {/* Upload Overlay Animation */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Box position="relative" display="inline-flex" mb={4}>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: uploadComplete ? 'radial-gradient(circle, rgba(52,168,83,0.4) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(66,133,244,0.4) 0%, transparent 70%)', zIndex: -1 }}
                            />
                            <svg width="220" height="220" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="8" />
                                <motion.circle
                                    cx="50" cy="50" r="45" fill="none"
                                    stroke={uploadComplete ? "url(#successGradient)" : "url(#loadingGradient)"}
                                    strokeWidth="8" strokeLinecap="round" strokeDasharray="283"
                                    initial={{ strokeDashoffset: 283 }}
                                    animate={{ strokeDashoffset: 283 - (283 * uploadProgress) / 100 }}
                                    transition={{ ease: "linear", duration: 0.03 }}
                                    style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                                />
                                <defs>
                                    <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#4285F4" />
                                        <stop offset="50%" stopColor="#EA4335" />
                                        <stop offset="100%" stopColor="#FBBC05" />
                                    </linearGradient>
                                    <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#34A853" />
                                        <stop offset="100%" stopColor="#1E8E3E" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {uploadComplete ? (
                                    <CustomCheckIcon size={70} color="#34A853" />
                                ) : (
                                    <Typography variant="h3" fontWeight="900" sx={{ background: 'linear-gradient(45deg, #4285F4, #EA4335)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {Math.round(uploadProgress)}<span style={{ fontSize: '1.5rem' }}>%</span>
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Typography variant="h4" fontWeight="900" color="#202124" sx={{ textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            {uploadComplete ? 'Audit Engine Initialized!' : 'Securely processing dataset...'}
                        </Typography>
                    </motion.div>
                )}
            </AnimatePresence>

            <Container maxWidth="lg" className="flex-grow flex flex-col relative z-10" sx={{ px: { xs: 2, md: 4 } }}>

                {/* Headline */}
                <Box className="text-center mb-16 mt-8 flex flex-col items-center justify-center">
                    <Box className="flex flex-wrap justify-center gap-x-4 mb-6" sx={{ perspective: 1200 }}>
                        {headlineWords.map((word, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0, y: 80, rotateX: -90, scale: 0.5, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' }}
                                transition={{ type: 'spring', damping: 14, stiffness: 120, delay: 0.1 + index * 0.08 }}
                                whileHover={{ scale: 1.2, rotateZ: index % 2 === 0 ? 8 : -8, y: -15, color: word.color, filter: 'brightness(1.2)' }}
                                style={{
                                    color: word.color, fontWeight: 900, fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
                                    lineHeight: 1.1, display: 'inline-block', cursor: 'crosshair',
                                    textShadow: `0 15px 30px ${word.color}60`, willChange: 'transform, filter'
                                }}
                            >
                                {word.text}
                            </motion.span>
                        ))}
                    </Box>
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}>
                        <Typography variant="h6" sx={{ maxWidth: 750, mb: 4, fontSize: { xs: '1.2rem', md: '1.6rem' }, lineHeight: 1.6, fontWeight: 600, color: 'rgba(0,0,0,0.7)', textShadow: '0 2px 10px rgba(255,255,255,0.8)' }}>
                            Upload your hiring, loan, or admissions dataset. EquiLens audits it for fairness in seconds using state-of-the-art AI.
                        </Typography>
                    </motion.div>
                </Box>

                {/* OVERHAULED CARDS SECTION */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6, mb: 16 }}>

                    {/* CRAZY FILE DROPZONE */}
                    <motion.div
                        initial={{ opacity: 0, x: -60, rotateY: 15 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ type: 'spring', delay: 1, bounce: 0.4 }}
                        whileHover={{ scale: 1.03, translateY: -15 }}
                        style={{ perspective: 1500, position: 'relative' }}
                    >
                        {/* Animated Gradient Aura */}
                        <Box sx={{ position: 'absolute', inset: -4, borderRadius: '32px', background: 'linear-gradient(135deg, #4285F4, #EA4335, #FBBC05, #34A853)', backgroundSize: '400% 400%', animation: 'gradientFlow 8s ease infinite', opacity: isDragging || file ? 1 : 0.4, filter: 'blur(12px)', transition: 'opacity 0.4s', zIndex: -1 }} />

                        <Card
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            elevation={0}
                            sx={{
                                p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                height: '100%', minHeight: '380px', borderRadius: '28px', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                                background: isDragging ? 'rgba(255,255,255,0.95)' : 'rgba(255, 255, 255, 0.75)',
                                backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.8)',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: isDragging
                                    ? '0 40px 80px rgba(66, 133, 244, 0.3), inset 0 0 40px rgba(66, 133, 244, 0.15)'
                                    : '0 20px 50px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255,255,255,1)',
                                '&::before': {
                                    content: '""', position: 'absolute', inset: 0, borderRadius: '28px', padding: '4px',
                                    background: isDragging || file ? 'linear-gradient(45deg, #4285F4, #34A853, #4285F4)' : 'linear-gradient(45deg, rgba(66,133,244,0.3), rgba(234,67,53,0.3), rgba(251,188,5,0.3), rgba(52,168,83,0.3))',
                                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                                    backgroundSize: '300% 300%', animation: 'gradientFlow 4s ease infinite', opacity: 0.8
                                }
                            }}
                        >
                            <input type="file" hidden ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} accept=".csv,.xlsx" />

                            <Box sx={{ animation: file ? 'none' : 'float 6s ease-in-out infinite', position: 'relative', zIndex: 2 }}>
                                {file ? (
                                    <CustomCheckIcon size={100} color="#34A853" />
                                ) : (
                                    <Box position="relative">
                                        <motion.div animate={{ scale: isDragging ? 1.3 : 1, rotate: isDragging ? 10 : 0 }} transition={{ type: 'spring', stiffness: 200 }}>
                                            <CloudUploadIcon sx={{ fontSize: 110, fill: 'url(#uploadGradient)', filter: isDragging ? 'drop-shadow(0 15px 25px rgba(66,133,244,0.6))' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', transition: 'all 0.3s' }} />
                                            <svg width="0" height="0">
                                                <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor={isDragging ? "#4285F4" : "#9e9e9e"} />
                                                    <stop offset="100%" stopColor={isDragging ? "#34A853" : "#e0e0e0"} />
                                                </linearGradient>
                                            </svg>
                                        </motion.div>
                                    </Box>
                                )}
                            </Box>

                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, mt: 3, color: file ? '#34A853' : '#202124', textAlign: 'center', zIndex: 2 }}>
                                {file ? file.name : (isDragging ? 'Release to Scan!' : 'Drop Dataset Here')}
                            </Typography>
                            {!file && <Typography variant="h6" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.4)', zIndex: 2 }}>or click to browse local files</Typography>}

                            {file && (
                                <Button size="large" variant="contained" sx={{ mt: 4, fontWeight: 900, borderRadius: 4, background: '#EA4335', color: '#fff', px: 4, py: 1.5, boxShadow: '0 10px 25px rgba(234, 67, 53, 0.4)', '&:hover': { background: '#c5221f', transform: 'scale(1.05)' } }} onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                    Remove File
                                </Button>
                            )}
                        </Card>
                    </motion.div>

                    {/* CRAZY GOOGLE SHEETS CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: 60, rotateY: -15 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ type: 'spring', delay: 1.2, bounce: 0.4 }}
                        whileHover={{ scale: 1.03, translateY: -15 }}
                        style={{ perspective: 1500, position: 'relative' }}
                    >
                        {/* Animated Gradient Aura */}
                        <Box sx={{ position: 'absolute', inset: -4, borderRadius: '32px', background: 'linear-gradient(135deg, #34A853, #FBBC05, #EA4335, #4285F4)', backgroundSize: '400% 400%', animation: 'gradientFlow 8s ease infinite', opacity: sheetUrl ? 1 : 0.4, filter: 'blur(12px)', transition: 'opacity 0.4s', zIndex: -1 }} />

                        <Card
                            elevation={0}
                            sx={{
                                p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                height: '100%', minHeight: '380px', borderRadius: '28px', position: 'relative', overflow: 'hidden',
                                background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(40px)',
                                border: '1px solid rgba(255,255,255,0.9)',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255,255,255,1)',
                            }}
                        >
                            {/* Sweeping Shimmer Light */}
                            <motion.div
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                                style={{ position: 'absolute', top: 0, bottom: 0, width: '50%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-25deg)', zIndex: 0 }}
                            />

                            <Box sx={{ animation: 'float 5s ease-in-out infinite reverse', zIndex: 2, position: 'relative' }}>
                                <motion.img
                                    animate={{ rotateZ: [-5, 5, -5] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                    src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png"
                                    alt="Google Sheets" width={90} height={90}
                                    style={{ marginBottom: 20, filter: 'drop-shadow(0 20px 20px rgba(52,168,83,0.4))' }}
                                />
                            </Box>

                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, zIndex: 2 }}>Import via Sheets</Typography>

                            <Box sx={{ width: '100%', mt: 4, mb: 2, zIndex: 2, position: 'relative' }}>
                                <TextField
                                    fullWidth variant="outlined" placeholder="Paste your Sheet URL" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                                            border: '2px solid transparent', transition: 'all 0.3s', fontSize: '1.2rem', py: 0.5,
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                                            backgroundClip: 'padding-box',
                                            '&:before': { content: '""', position: 'absolute', inset: -2, borderRadius: '22px', background: 'linear-gradient(90deg, #4285F4, #34A853)', zIndex: -1, opacity: 0, transition: 'opacity 0.3s' },
                                            '&.Mui-focused': { boxShadow: '0 15px 35px rgba(66, 133, 244, 0.2)' },
                                            '&.Mui-focused:before': { opacity: 1 }
                                        },
                                        '& fieldset': { border: 'none' }
                                    }}
                                    slotProps={{ input: { startAdornment: ( <InputAdornment position="start"><InsertLinkIcon sx={{ color: '#4285F4', fontSize: 32 }} /></InputAdornment> ) } }}
                                />
                            </Box>

                            <Typography variant="subtitle1" sx={{ mb: 4, display: 'block', textAlign: 'center', fontWeight: 700, color: 'rgba(0,0,0,0.5)', zIndex: 2 }}>Must be "Anyone with link can view"</Typography>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: '100%', zIndex: 2 }}>
                                <Button variant="contained" fullWidth size="large"
                                        sx={{
                                            background: 'linear-gradient(45deg, #4285F4, #EA4335, #FBBC05, #34A853)',
                                            backgroundSize: '300% 300%',
                                            animation: 'gradientFlow 4s ease infinite',
                                            color: 'white', py: 2, borderRadius: '20px', fontWeight: 900, textTransform: 'none', fontSize: '1.3rem',
                                            boxShadow: '0 20px 40px rgba(66, 133, 244, 0.5)', border: '1px solid rgba(255,255,255,0.4)',
                                            '&:disabled': { background: '#e0e0e0', color: '#9e9e9e', boxShadow: 'none' }
                                        }}
                                        onClick={handleUploadClick} disabled={(!file && !sheetUrl) || isUploading}
                                >
                                    Connect & Start Audit
                                </Button>
                            </motion.div>
                        </Card>
                    </motion.div>
                </Box>

                {/* Templates Picker */}
                <Box className="mt-4 mb-24 relative">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}>
                        <Typography variant="h2" align="center" gutterBottom sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.03em', textShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>Choose a Context</Typography>
                        <Typography variant="body1" align="center" sx={{ mb: 8, fontSize: '1.3rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>Select a domain for smart bias-detection parameters.</Typography>
                    </motion.div>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
                        {templates.map((tpl, i) => (
                            <motion.div
                                key={tpl.id}
                                whileHover={{ y: -20, scale: 1.05, rotateX: 8, rotateY: -8 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 80 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: i * 0.15, type: 'spring', stiffness: 250, damping: 20 }}
                                style={{ height: '100%', perspective: 1200 }}
                            >
                                <Card elevation={0} onClick={() => setSelectedTemplate(tpl.id)}
                                      sx={{
                                          p: 5, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                          height: '100%', borderRadius: '28px', position: 'relative', overflow: 'hidden', zIndex: 1,
                                          border: `2px solid ${selectedTemplate === tpl.id ? tpl.color : 'rgba(255,255,255,0.8)'}`,
                                          background: selectedTemplate === tpl.id ? tpl.bg : 'rgba(255,255,255,0.6)',
                                          backdropFilter: 'blur(20px)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                          boxShadow: selectedTemplate === tpl.id
                                              ? `0 25px 60px ${tpl.color}50, inset 0 0 30px ${tpl.color}20`
                                              : '0 10px 30px rgba(0,0,0,0.05)'
                                      }}
                                >
                                    {selectedTemplate === tpl.id && (
                                        <motion.div layoutId="activeTemplateGlow"
                                                    style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 120% at 50% 0%, ${tpl.color}40 0%, transparent 60%)`, zIndex: -1 }}
                                                    animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                                        />
                                    )}
                                    <Box sx={{
                                        mb: 4, p: 3.5, borderRadius: '50%',
                                        background: selectedTemplate === tpl.id ? 'white' : 'rgba(255,255,255,0.9)',
                                        boxShadow: selectedTemplate === tpl.id ? `0 15px 30px ${tpl.color}40` : '0 8px 20px rgba(0,0,0,0.08)',
                                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        ...(selectedTemplate === tpl.id && { transform: 'scale(1.25) translateY(-5px) rotate(15deg)' })
                                    }}>
                                        {tpl.icon}
                                    </Box>
                                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#202124', letterSpacing: '-0.02em' }}>{tpl.title}</Typography>
                                    <Typography variant="subtitle1" sx={{ color: 'rgba(0,0,0,0.6)', lineHeight: 1.6, fontWeight: 600 }}>{tpl.subtext}</Typography>
                                </Card>
                            </motion.div>
                        ))}
                    </Box>
                </Box>
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%', borderRadius: 4, boxShadow: '0 10px 30px rgba(234, 67, 53, 0.3)', fontWeight: 800, fontSize: '1.1rem' }}>{error}</Alert>
            </Snackbar>
        </Box>
    );
}