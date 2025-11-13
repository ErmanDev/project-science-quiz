// server/src/config.ts
const getFlag = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) ?? defaultValue;
};

export const REQUIRE_VERIFICATION =
  getFlag('requireVerification', 'false') === 'true';

// For server: use process.env
// For browser: Vite replaces import.meta.env at build time
export const API_URL = (() => {
  if (typeof window === 'undefined') {
    // Server environment (Node.js)
    return process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:4000';
  }
  
  // Browser environment (Vite)
  // Check for Vite's injected constant first
  // @ts-ignore
  if (typeof __VITE_API_URL__ !== 'undefined' && __VITE_API_URL__) {
    // @ts-ignore
    return __VITE_API_URL__;
  }
  
  // If that doesn't work, return default
  return 'http://localhost:4000';
})();