import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    throw new Error(message);
  }
);

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const uploadGoogleSheet = async (sheetUrl) => {
  const response = await apiClient.post('/upload', { sheet_url: sheetUrl });
  return response.data;
};

export const analyzeDataset = async () => {
  const response = await apiClient.post('/analyze');
  return response.data;
};

export const getSummary = async (metrics, language = 'en') => {
  const response = await apiClient.post('/summary', { metrics, language });
  return response.data;
};

export const exportReport = async () => {
  const response = await apiClient.get('/export', {
    responseType: 'blob'
  });
  return response.data;
};

export const getRecommendations = async () => {
  const response = await apiClient.get('/recommendation');
  return response.data;
};

export const applyFix = async (modelName) => {
  const response = await apiClient.post('/fix', { model_name: modelName });
  return response.data;
};

export const downloadFixedDataset = async () => {
  const response = await apiClient.get('/download', {
    responseType: 'blob'
  });
  return response.data;
};

export default apiClient;
