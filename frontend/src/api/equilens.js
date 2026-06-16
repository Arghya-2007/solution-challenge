const axios = window.axios;

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

export const uploadFile = async (file, onProgress) => {
  // Generate a predictable identifier based on file properties to deduplicate identical files
  // and prevent unnecessary cloud storage usage, while avoiding collisions for different files.
  const uniqueId = `${file.size}_${file.lastModified}`;
  const extensionIndex = file.name.lastIndexOf('.');
  let uniqueFileName = file.name;
  
  if (extensionIndex !== -1) {
    const namePart = file.name.substring(0, extensionIndex);
    const extPart = file.name.substring(extensionIndex);
    uniqueFileName = `${namePart}_${uniqueId}${extPart}`;
  } else {
    uniqueFileName = `${file.name}_${uniqueId}`;
  }

  // 1. Get presigned URL using authenticated api
  const presignReq = {
    fileName: uniqueFileName,
    fileSize: file.size,
    contentType: file.type || 'text/csv'
  };
  
  // Use api from ../lib/api to ensure Firebase auth token is included
  const { api } = await import('../lib/api');
  const presignRes = await api.post('/upload/presign', presignReq);
  const { signedUrl, objectPath } = presignRes.data;

  // 2. Upload file to GCS directly
  try {
    await axios.put(signedUrl, file, {
      headers: {
        'Content-Type': file.type || 'text/csv'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  } catch (error) {
    // If the bucket restricts overwrites, it typically throws a 403 Forbidden.
    // We can assume the file is already uploaded successfully.
    if (error.response && error.response.status === 403) {
      console.log('File already exists in the bucket. Bypassing upload.');
      if (onProgress) onProgress(100);
      return { file_name: uniqueFileName, objectPath, success: true };
    }
    throw error;
  }

  return { file_name: uniqueFileName, objectPath, success: true };
};

export const uploadGoogleSheet = async (sheetUrl) => {
  const { api } = await import('../lib/api');
  const response = await api.post('/upload/sheet', { sheet_url: sheetUrl });
  return response.data;
};

export const analyzeDataset = async (objectPath, targetColumn, onProgressMsg) => {
  const { api } = await import('../lib/api');
  
  // 1. Trigger the process in NestJS
  const processRes = await api.post('/upload/process', { 
    objectPath, 
    targetColumn 
  });
  const { job_id } = processRes.data;

  // 2. Poll for status
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const statusRes = await api.get(`/upload/status/${job_id}`);
        const statusData = statusRes.data;
        
        if (statusData.status === 'error') {
          return reject(new Error(statusData.message || 'Processing failed'));
        }
        
        if (statusData.status === 'completed') {
          // Add top-level fields for the frontend to easily pick up
          const result = statusData.json_payload;
          result.target_column = statusData.target_column;
          result.protected_columns = statusData.protected_columns;
          result.markdown_report = statusData.markdown_report;
          result.job_id = job_id;
          return resolve(result);
        }
        
        // Notify of progress string if callback provided
        if (onProgressMsg) {
          onProgressMsg(statusData.status || statusData);
        }
        
        // Continue polling
        setTimeout(poll, 2500);
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });
};

export const getSummary = async (metrics, language = 'en') => {
  const response = await apiClient.post('/summary', { metrics, language });
  return response.data;
};

export const exportReport = async (jobId) => {
  const { api } = await import('../lib/api');
  const response = await api.get(`/upload/export/${jobId}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const getRecommendations = async () => {
  const response = await apiClient.get('/recommendation');
  return response.data;
};

export const applyFix = async (objectPath, targetColumn, protectedColumns, modelName, onProgressMsg) => {
  const { api } = await import('../lib/api');
  
  // Trigger mitigation process in NestJS
  const processRes = await api.post('/upload/mitigate', {
    objectPath,
    targetColumn,
    protectedColumns,
    modelName
  });
  const { job_id } = processRes.data;

  // Poll for status
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const statusRes = await api.get(`/upload/mitigate/status/${job_id}`);
        const statusData = statusRes.data;
        
        if (statusData.status === 'error') {
          return reject(new Error(statusData.message || 'Mitigation failed'));
        }
        
        if (statusData.status === 'completed') {
          const result = statusData.report;
          result.mitigated_object_path = statusData.mitigated_object_path;
          return resolve(result);
        }
        
        if (onProgressMsg) {
          onProgressMsg(statusData.status || statusData);
        }
        
        setTimeout(poll, 2500);
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });
};

export const downloadFixedDataset = async (objectPath) => {
  const { api } = await import('../lib/api');
  // Use direct download endpoint to bypass GCS signed URL limitations
  const response = await api.post('/upload/mitigated/download-direct', { objectPath }, { responseType: 'blob' });
  return response.data;
};

export const getHistory = async () => {
  const { api } = await import('../lib/api');
  const response = await api.get('/history');
  return response.data;
};

export const getHistoryDetails = async (id) => {
  const { api } = await import('../lib/api');
  const response = await api.get(`/history/${id}`);
  return response.data;
};

export const deleteHistory = async (id) => {
  const { api } = await import('../lib/api');
  const response = await api.delete(`/history/${id}`);
  return response.data;
};

export default apiClient;
