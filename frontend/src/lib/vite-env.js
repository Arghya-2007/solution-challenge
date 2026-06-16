
// Export Vite environment variables from a plain JS module to avoid
// TypeScript parsing issues with `import.meta` in some editor/typechecker setups.
export const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const VITE_FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
export const VITE_FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
export const VITE_FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
export const VITE_FIREBASE_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
export const VITE_FIREBASE_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
export const VITE_FIREBASE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID;
export const VITE_FIREBASE_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
