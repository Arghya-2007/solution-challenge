const axios = window.axios;

import { auth } from './firebase';
import { VITE_API_BASE_URL } from './vite-env.js';

export const api = axios.create({
  baseURL: VITE_API_BASE_URL,
  withCredentials: true, // Required for cookies
});

api.interceptors.request.use(
  async (config) => {
    // Check if the user is currently logged in
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Fallback: still send token in Authorization header,
        // Backend strategy is updated to read cookie first, then header.
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error fetching Firebase ID token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API access detected. Redirecting to login...");
      // Auto logout and redirect
      if (auth.currentUser) {
        auth.signOut().then(() => {
          window.location.href = '/auth';
        });
      } else {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);
