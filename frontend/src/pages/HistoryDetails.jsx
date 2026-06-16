import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getHistoryDetails } from '../api/equilens';
import Analyze from './Analyze';
import MigrationDashboard from './MigrationDashboard';

export default function HistoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getHistoryDetails(id)
      .then(res => setData(res))
      .catch(err => {
        console.error(err);
        setError(true);
      });
  }, [id]);

  if (error) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Typography variant="h5" color="error" gutterBottom sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
            Failed to load history details.
        </Typography>
        <Typography 
            sx={{ cursor: 'pointer', color: '#4285F4', textDecoration: 'underline', fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
            onClick={() => navigate('/history')}
        >
            Go back to History
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const injectedState = {
    historyReport: data
  };

  if (data.type === 'audit') {
    return <Analyze injectedState={injectedState} />;
  } else if (data.type === 'mitigation') {
    return <MigrationDashboard injectedState={injectedState} />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Unknown report type: {data.type}</Typography>
    </Box>
  );
}
