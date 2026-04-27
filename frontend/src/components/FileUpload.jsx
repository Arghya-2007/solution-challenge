import React, { useState, useRef } from 'react';
import { Typography, Button, Box, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileUpload({ file, setFile }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <motion.div
            style={{ height: '100%', perspective: 1000 }}
            animate={{
                scale: isDragging ? 1.03 : 1,
                rotateX: isDragging ? 5 : 0,
                rotateY: isDragging ? -5 : 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current.click()}
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 5,
                    p: 5,
                    textAlign: 'center',
                    height: '100%',
                    minHeight: { xs: 280, md: 340 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: file ? 'default' : 'pointer',
                    // Extreme Glassmorphism matching the Landing Page
                    background: isDragging
                        ? 'rgba(66, 133, 244, 0.15)'
                        : (file ? 'rgba(52, 168, 83, 0.05)' : 'rgba(255, 255, 255, 0.4)'),
                    backdropFilter: 'blur(20px)',
                    border: '2px solid',
                    borderColor: isDragging
                        ? '#4285F4'
                        : (file ? 'rgba(52, 168, 83, 0.4)' : 'rgba(255, 255, 255, 0.8)'),
                    boxShadow: isDragging
                        ? '0 20px 40px rgba(66, 133, 244, 0.3)'
                        : 'none', // Box shadow handled by parent container now
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
            >
                {/* Animated Glow Backdrop during Drag */}
                <AnimatePresence>
                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(circle at 50% 50%, rgba(66, 133, 244, 0.2) 0%, transparent 70%)',
                                pointerEvents: 'none',
                                zIndex: 0
                            }}
                        />
                    )}
                </AnimatePresence>

                <Box sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <AnimatePresence mode="wait">
                        {!file ? (
                            <motion.div
                                key="upload-prompt"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                transition={{ duration: 0.3 }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                <motion.div
                                    animate={{ y: isDragging ? -15 : [0, -8, 0], scale: isDragging ? 1.2 : 1 }}
                                    transition={{ duration: 3, repeat: isDragging ? 0 : Infinity, ease: 'easeInOut' }}
                                >
                                    <CloudUploadIcon sx={{
                                        fontSize: 80,
                                        color: isDragging ? '#4285F4' : 'rgba(0,0,0,0.4)',
                                        mb: 2,
                                        filter: isDragging ? 'drop-shadow(0px 10px 20px rgba(66,133,244,0.5))' : 'none',
                                        transition: 'color 0.3s'
                                    }} />
                                </motion.div>

                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, color: isDragging ? '#4285F4' : '#202124', transition: 'color 0.3s' }}>
                                    {isDragging ? 'Drop it like it\'s hot!' : 'Drag & Drop CSV'}
                                </Typography>

                                <Typography variant="body1" sx={{ mb: 4, fontWeight: 500, color: 'rgba(0,0,0,0.5)' }}>
                                    or click to browse local files
                                </Typography>

                                <Button
                                    variant="contained"
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                                    sx={{
                                        background: 'rgba(255,255,255,0.8)',
                                        color: '#4285F4',
                                        borderRadius: 3,
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        fontSize: '1.05rem',
                                        px: 4,
                                        py: 1.2,
                                        boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                                        border: '1px solid rgba(66, 133, 244, 0.3)',
                                        '&:hover': { background: '#fff', boxShadow: '0 8px 20px rgba(66, 133, 244, 0.2)', transform: 'translateY(-2px)' },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Choose File
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="file-success"
                                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                <Box sx={{ position: 'relative', mb: 3 }}>
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                        <Box sx={{ position: 'absolute', inset: 0, background: '#34A853', borderRadius: '50%', filter: 'blur(20px)', opacity: 0.3 }} />
                                    </motion.div>
                                    <CheckCircleIcon sx={{ fontSize: 90, color: '#34A853', position: 'relative', zIndex: 1 }} />
                                </Box>

                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#202124', mb: 1 }}>
                                    File Secured
                                </Typography>

                                {/* Custom File Chip styling to match the massive UI */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.7)',
                                    borderRadius: 3,
                                    pl: 3, pr: 1, py: 1,
                                    border: '1px solid rgba(52, 168, 83, 0.3)',
                                    boxShadow: '0 8px 24px rgba(52, 168, 83, 0.15)',
                                    maxWidth: '90%'
                                }}>
                                    <Typography noWrap sx={{ fontWeight: 700, color: '#34A853', mr: 2, fontSize: '1.1rem' }}>
                                        {file.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        sx={{ background: 'rgba(234, 67, 53, 0.1)', color: '#EA4335', '&:hover': { background: 'rgba(234, 67, 53, 0.2)', transform: 'rotate(90deg)' }, transition: 'all 0.3s' }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>

                <input
                    type="file"
                    accept=".csv,.xlsx"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </Box>
        </motion.div>
    );
}