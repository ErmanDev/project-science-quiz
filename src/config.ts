// Frontend configuration - uses environment variables
// In Vercel, set VITE_API_URL in environment variables
export const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// For development, you can use the proxy
// For production, set VITE_API_URL to your backend URL (e.g., https://your-backend.onrender.com)

const getFlag = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) ?? defaultValue;
};

export const REQUIRE_VERIFICATION =
  getFlag('requireVerification', 'false') === 'true';

