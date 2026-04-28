import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Grid, Card, CardContent, Chip, Divider, Snackbar, Alert
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion, AnimatePresence } from 'framer-motion';
import { applyFix, downloadFixedDataset } from '../api/equilens';

const THEME = {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
    dark: '#202124'
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Recomendation() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};
    const { recommendations } = state;

    const [fixLoading, setFixLoading] = useState(false);
    const [fixResult, setFixResult] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    const handleApplyFix = async (modelName) => {
        setFixLoading(true);
        try {
            const res = await applyFix(modelName);
            setFixResult(res);
            setSnackbarMsg(`Bias mitigation applied using ${modelName}!`);
            setSnackbarOpen(true);
        } catch (error) {
            console.error(error);
            setSnackbarMsg("Failed to apply bias fix.");
            setSnackbarOpen(true);
        } finally {
            setFixLoading(false);
        }
    };

    const handleDownloadFixedCSV = async () => {
        try {
            const blob = await downloadFixedDataset();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fixed_dataset.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch(error) {
            console.error(error);
            setSnackbarMsg("CSV Download failed.");
            setSnackbarOpen(true);
        }
    };

    return (
        <Box className="min-h-screen relative overflow-hidden" sx={{ background: '#f8f9fa', pt: { xs: 4, md: 6 }, pb: 12 }}>
            <Box sx={{ maxWidth: 1300, mx: 'auto', px: 3, position: 'relative', zIndex: 10 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 4, color: THEME.dark, fontWeight: 700 }}>
                    Back to Analysis
                </Button>

                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    {recommendations && (
                        <motion.div variants={itemVariants}>
                            <Typography variant="h4" fontWeight="900" sx={{ mb: 3, color: THEME.dark }}>
                                Mitigation Strategies
                            </Typography>
                            <Grid container spacing={3} sx={{ mb: 6 }}>
                                {recommendations.recommendations?.map((rec, idx) => (
                                    <Grid item xs={12} md={6} key={idx}>
                                        <Card sx={{ borderRadius: '20px', height: '100%', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
                                            <CardContent>
                                                <Chip label={rec.category} size="small" sx={{ mb: 1, bgcolor: THEME.blue, color: '#fff', fontWeight: 700 }} />
                                                <Typography variant="h6" fontWeight="800">{rec.method}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>{rec.description}</Typography>
                                                <Divider sx={{ my: 1 }} />
                                                <Box display="flex" justifyContent="space-between" mt={1}>
                                                    <Typography variant="caption" fontWeight="700">Bias Impact: <span style={{color: THEME.green}}>{rec.impact_on_bias}</span></Typography>
                                                    <Typography variant="caption" fontWeight="700">Accuracy Impact: <span style={{color: THEME.yellow}}>{rec.impact_on_accuracy}</span></Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants}>
                        <Paper sx={{ p: 4, mb: 4, borderRadius: '24px', background: `linear-gradient(135deg, ${THEME.dark}, #3c4043)`, color: '#fff' }}>
                            <Typography variant="h4" fontWeight="900" gutterBottom>
                                EquiFix Pipeline
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.8, mb: 4 }}>
                                Apply automated bias mitigation. Our engine will retrain a fair model using Exponentiated Gradient Reduction.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {['LogisticRegression', 'RandomForestClassifier', 'DecisionTreeClassifier'].map(model => (
                                    <Button
                                        key={model}
                                        disabled={fixLoading}
                                        onClick={() => handleApplyFix(model)}
                                        variant="contained"
                                        sx={{
                                            bgcolor: THEME.blue,
                                            borderRadius: '10px',
                                            px: 3,
                                            textTransform: 'none',
                                            fontWeight: 700
                                        }}
                                    >
                                        Fix with {model.replace('Classifier', '')}
                                    </Button>
                                ))}
                            </Box>

                            <AnimatePresence>
                                {fixResult && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '24px' }}>
                                        <Box sx={{ p: 3, borderRadius: '15px', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <Typography variant="h6" fontWeight="800" color={THEME.green} mb={2}>Mitigation Results</Typography>

                                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                                            <th style={{ textAlign: 'left', padding: '12px', opacity: 0.7 }}>Metric</th>
                                                            <th style={{ textAlign: 'center', padding: '12px', opacity: 0.7 }}>Before</th>
                                                            <th style={{ textAlign: 'center', padding: '12px', opacity: 0.7 }}>After</th>
                                                            <th style={{ textAlign: 'right', padding: '12px', opacity: 0.7 }}>Improvement</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <td style={{ padding: '12px', fontWeight: 700 }}>Bias (DPD)</td>
                                                            <td style={{ textAlign: 'center', padding: '12px' }}>{fixResult.before?.demographic_parity_difference.toFixed(4)}</td>
                                                            <td style={{ textAlign: 'center', padding: '12px', color: THEME.green, fontWeight: 800 }}>{fixResult.after?.demographic_parity_difference.toFixed(4)}</td>
                                                            <td style={{ textAlign: 'right', padding: '12px', color: THEME.green }}>{(fixResult.improvement?.bias_reduction * 100).toFixed(1)}%</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '12px', fontWeight: 700 }}>Accuracy</td>
                                                            <td style={{ textAlign: 'center', padding: '12px' }}>{(fixResult.before?.accuracy * 100).toFixed(1)}%</td>
                                                            <td style={{ textAlign: 'center', padding: '12px' }}>{(fixResult.after?.accuracy * 100).toFixed(1)}%</td>
                                                            <td style={{ textAlign: 'right', padding: '12px', color: fixResult.improvement?.accuracy_change >= 0 ? THEME.green : THEME.red }}>
                                                                {(fixResult.improvement?.accuracy_change * 100).toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </Box>

                                            <Button
                                                fullWidth
                                                startIcon={<CloudDownloadIcon />}
                                                onClick={handleDownloadFixedCSV}
                                                variant="contained"
                                                sx={{ mt: 3, bgcolor: THEME.green, fontWeight: 800, borderRadius: '10px', '&:hover': { bgcolor: '#2d8b46' } }}
                                            >
                                                Download Mitigated Dataset
                                            </Button>
                                        </Box>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Paper>
                    </motion.div>
                </motion.div>
            </Box>

            <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbarMsg.includes('failed') ? 'error' : 'success'} sx={{ borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontWeight: 700 }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
