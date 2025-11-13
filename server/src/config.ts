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
    // Server environment
    return process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:4000';
  }
  
  // Browser environment
  // Vite will replace import.meta.env.VITE_API_URL at build time
  // We use a function to access it without syntax errors
  const getEnvVar = () => {
    try {
      // Access through Function constructor to avoid syntax error
      return new Function('return (typeof import !== "undefined" && import.meta?.env?.VITE_API_URL)')();
    } catch {
      return undefined;
    }
  };
  
  return getEnvVar() || 'http://localhost:4000';
})();