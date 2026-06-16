import { useState } from 'react';
import ErrorPage from './ErrorPage';
import { Box, Button, Typography, Stack } from '@mui/material';

export default function ErrorTest() {
    const [errorCode, setErrorCode] = useState(null);

    if (errorCode) {
        return (
            <Box position="relative">
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setErrorCode(null)}
                    sx={{ position: 'absolute', top: 16, left: 16, zIndex: 999999 }}
                >
                    Back to Test Menu
                </Button>
                <ErrorPage code={errorCode} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" mb={4}>Test Error Pages</Typography>
            <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => setErrorCode('404')}>Test 404</Button>
                <Button variant="contained" onClick={() => setErrorCode('500')}>Test 500</Button>
                <Button variant="contained" onClick={() => setErrorCode('503')}>Test 503</Button>
                <Button variant="contained" onClick={() => setErrorCode('default')}>Test Default</Button>
            </Stack>
        </Box>
    );
}
