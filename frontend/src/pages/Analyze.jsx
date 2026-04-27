import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Alert, TextField, Autocomplete, MenuItem, Button,
    Skeleton, Accordion, AccordionSummary, AccordionDetails, Snackbar,
    Paper, GlobalStyles, Chip, Divider, Grid, Card, CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LanguageIcon from '@mui/icons-material/Language';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    analyzeDataset, 
    getSummary, 
    getRecommendations, 
    applyFix, 
    exportReport, 
    downloadFixedDataset 
} from '../api/equilens';
import MetricCard from '../components/MetricCard';
import BiasChart from '../components/BiasChart';
import ExplanationBox from '../components/ExplanationBox';

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

export default function Analyze() {
    const location = useLocation();
    const state = location.state || {};

    const columns = state.data?.columns || state.columns || [];

    const [protectedAttrs, setProtectedAttrs] = useState([]);
    const [targetColumn, setTargetColumn] = useState('');
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(false);
    const [fixLoading, setFixLoading] = useState(false);

    const [results, setResults] = useState(null);
    const [summary, setSummary] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [fixResult, setFixResult] = useState(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setResults(null);
        setSummary(null);
        setRecommendations(null);
        setFixResult(null);

        try {
            const analysisRes = await analyzeDataset();
            setResults(analysisRes);
            
            setTargetColumn(analysisRes.bias_audit?.target_column || '');
            const flagged = Object.keys(analysisRes.bias_audit?.flagged_features || {});
            setProtectedAttrs(flagged);

            // Pass the exact metrics payload to the summary generator
            const metricsPayload = analysisRes.fairness_metrics || {};

            const [summaryRes, recsRes] = await Promise.all([
                getSummary(metricsPayload, language),
                getRecommendations()
            ]);

            setSummary(summaryRes);
            setRecommendations(recsRes);

        } catch (error) {
            console.error(error);
            setSnackbarMsg("Failed to run analysis. Ensure a dataset is uploaded.");
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFix = async (modelName) => {
        setFixLoading(true);
        try {
            const res = await applyFix(modelName);
            setFixResult(res);
            setSnackbarMsg(`Bias mitigation applied using ${modelName}!`);
            setSnackbarOpen(true);
        } catch (e) {
            setSnackbarMsg("Failed to apply bias fix.");
            setSnackbarOpen(true);
        } finally {
            setFixLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const blob = await exportReport();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `EquiLens_Audit_Report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch(e) {
            setSnackbarMsg("PDF Generation failed.");
            setSnackbarOpen(true);
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
        } catch(e) {
            setSnackbarMsg("CSV Download failed.");
            setSnackbarOpen(true);
        }
    };

    // Data mapping from backend
    const fairnessData = results?.fairness_metrics || {};
    const severity = fairnessData.severity || 'low';
    const metricsArray = fairnessData.metrics || [];
    const rawCounts = fairnessData.raw_counts?.by_sensitive_feature || {};
    
    // Choose the most significant attribute to show in the chart
    const activeAttribute = protectedAttrs[0] || (metricsArray.length > 0 ? metricsArray[0].feature : null);

    const dpdMetric = metricsArray.find(m => m.feature === activeAttribute) || { value: 0, threshold: 0.1, pass: true };

    let chartData = [];
    let totalApplicants = 0;
    let minRate = Infinity;
    let maxRate = -Infinity;

    if (activeAttribute && rawCounts[activeAttribute]) {
        const groups = rawCounts[activeAttribute];
        Object.keys(groups).forEach(key => {
            const rate = groups[key].positive_rate || 0;
            const total = groups[key].total_in_group || 0;

            chartData.push({ name: key, rate: rate, total: total });
            totalApplicants += total;

            if (rate < minRate) minRate = rate;
            if (rate > maxRate) maxRate = rate;
        });
    }

    const disparateImpact = (maxRate > 0 && minRate !== Infinity) ? (minRate / maxRate) : 1.0;
    const diPass = disparateImpact >= 0.8;

    const activeColor = severity === 'critical' ? THEME.red :
        severity === 'medium' ? THEME.yellow : THEME.green;

    useEffect(() => {
        if (results) {
            getSummary(results.fairness_metrics || {}, language)
                .then(setSummary)
                .catch(() => console.error("Language switch failed"));
        }
    }, [language, results]);

    const inputStyle = {
        '& .MuiInputLabel-root': { color: '#5F6368', fontWeight: 500 },
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease-in-out',
            '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.3)' },
            '&.Mui-focused': { bgcolor: '#fff', boxShadow: `0 4px 15px ${THEME.blue}30` }
        }
    };

    return (
        <Box className="min-h-screen relative overflow-hidden" sx={{ background: '#f8f9fa', pt: { xs: 4, md: 6 }, pb: 12 }}>
            <GlobalStyles styles={{
                '@keyframes orbMove': {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' }
                },
                '@keyframes gradientBorder': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' }
                }
            }} />

            <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', filter: 'blur(80px)', opacity: 0.6 }}>
                <Box sx={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', background: THEME.blue, borderRadius: '50%', animation: 'orbMove 15s infinite alternate ease-in-out' }} />
                <Box sx={{ position: 'absolute', top: '20%', right: '-10%', width: '40vw', height: '40vw', background: THEME.red, borderRadius: '50%', animation: 'orbMove 20s infinite alternate-reverse ease-in-out' }} />
                <Box sx={{ position: 'absolute', bottom: '-20%', left: '15%', width: '60vw', height: '60vw', background: THEME.yellow, borderRadius: '50%', animation: 'orbMove 25s infinite alternate ease-in-out' }} />
                <Box sx={{ position: 'absolute', bottom: '10%', right: '20%', width: '30vw', height: '30vw', background: THEME.green, borderRadius: '50%', animation: 'orbMove 18s infinite alternate-reverse ease-in-out' }} />
            </Box>

            <Box sx={{ maxWidth: 1300, mx: 'auto', px: 3, position: 'relative', zIndex: 10 }}>
                <AnimatePresence mode="wait">
                    {results && !loading && (
                        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}>
                            <Paper sx={{ mb: 5, p: 3, display: 'flex', alignItems: 'center', gap: 3, borderRadius: '16px', border: `1px solid ${activeColor}50`, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', boxShadow: `0 10px 40px ${activeColor}30`, position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', bgcolor: activeColor }} />
                                <Box sx={{ p: 1.5, borderRadius: '12px', background: `${activeColor}15` }}>
                                    <AutoFixHighIcon sx={{ color: activeColor, fontSize: 32 }} />
                                </Box>
                                <Typography variant="h6" fontWeight="600" color={THEME.dark}>
                                    Audit Complete: <span style={{ color: activeColor, fontWeight: 900, textTransform: 'uppercase' }}>{severity}</span> Severity — Analyzed {totalApplicants} records for "{targetColumn}".
                                </Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Button startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPDF} variant="outlined" sx={{ borderRadius: '10px', fontWeight: 700, borderColor: THEME.blue, color: THEME.blue }}>
                                    Report
                                </Button>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    <Typography variant="h3" fontWeight="900" sx={{ mb: 4, color: THEME.dark, letterSpacing: '-1px', textShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        EquiLens Engine
                    </Typography>

                    <motion.div variants={itemVariants}>
                        <Paper sx={{ p: 4, mb: 6, borderRadius: '24px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: `linear-gradient(90deg, ${THEME.blue}, ${THEME.red}, ${THEME.yellow}, ${THEME.green}, ${THEME.blue})`, backgroundSize: '200% 100%', animation: 'gradientBorder 4s linear infinite', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }} />

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto' }, gap: 3, alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="body1" fontWeight="700" color={THEME.dark} mb={1}>
                                        Ready to audit: <strong>{state.data?.file_name || 'Active Dataset'}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        AI will automatically detect protected attributes and target outcomes.
                                    </Typography>
                                </Box>

                                <TextField select fullWidth label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} sx={inputStyle} InputProps={{ startAdornment: <LanguageIcon sx={{ mr: 1, color: THEME.blue }}/> }}>
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="hi">Hindi</MenuItem>
                                </TextField>

                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ height: '56px' }}>
                                    <Button disabled={loading} onClick={handleAnalyze} sx={{ height: '100%', px: 5, borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem', color: '#fff', background: `linear-gradient(135deg, ${THEME.blue}, #1a73e8)`, boxShadow: `0 10px 20px ${THEME.blue}40`, textTransform: 'none' }}>
                                        {loading ? 'Analyzing...' : 'Run Audit'}
                                    </Button>
                                </motion.div>
                            </Box>
                        </Paper>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
                                    {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.5)' }} animation="wave" /> )}
                                </Box>
                                <Skeleton variant="rounded" height={400} sx={{ borderRadius: '24px', mb: 4, bgcolor: 'rgba(255,255,255,0.5)' }} animation="wave" />
                            </motion.div>
                        )}

                        {results && !loading && (
                            <motion.div key="results" variants={containerVariants} initial="hidden" animate="show">
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>

                                    <motion.div variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }}>
                                        <Paper sx={{ borderRadius: '24px', p: 3, height: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                            <MetricCard title="Demographic Parity" value={dpdMetric.value} passed={dpdMetric.pass} tooltip="Measures the difference in positive outcome rates between groups." />
                                        </Paper>
                                    </motion.div>

                                    <motion.div variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }}>
                                        <Paper sx={{ borderRadius: '24px', p: 3, height: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                            <MetricCard title="Disparate Impact" value={parseFloat(disparateImpact.toFixed(3))} passed={diPass} tooltip="The ratio of the positive outcome rate of the unprivileged group to the privileged group." />
                                        </Paper>
                                    </motion.div>

                                    <motion.div variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }}>
                                        <Paper sx={{ borderRadius: '24px', p: 3, height: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                            <MetricCard title="Sensitive Features" value={protectedAttrs.length} passed={protectedAttrs.length > 0} tooltip="Number of features identified as protected or proxy attributes." />
                                        </Paper>
                                    </motion.div>

                                </Box>

                                <motion.div variants={itemVariants}>
                                    <Paper sx={{ p: 4, mb: 4, borderRadius: '24px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.06)' }}>
                                        <BiasChart data={chartData} attributeName={activeAttribute || 'Protected Attribute'} />
                                    </Paper>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <Box sx={{ mb: 6, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)' }}>
                                        <ExplanationBox 
                                            text={summary?.summary} 
                                            worstGroup={summary?.worst_affected_group} 
                                            worstFactor={summary?.discrimination_factor} 
                                            suggestedFix={summary?.fix_action} 
                                            language={language}
                                            onLanguageChange={setLanguage}
                                        />
                                    </Box>
                                </motion.div>

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
                        )}
                    </AnimatePresence>
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