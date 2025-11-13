// server/src/config.ts
const getFlag = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) ?? defaultValue;
};

export const REQUIRE_VERIFICATION =
  getFlag('requireVerification', 'false') === 'true';

// For server: use process.env
// For browser: Vite injects __VITE_API_URL__ via define in vite.config.ts
// or we can use import.meta.env.VITE_API_URL directly
export const API_URL = (() => {
  if (typeof window === 'undefined') {
    // Server environment (Node.js)
    return process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:4000';
  }
  
  // Browser environment (Vite)
  // Try Vite's injected constant first (from vite.config.ts define)
  // @ts-ignore - This is injected by Vite at build time
  if (typeof __VITE_API_URL__ !== 'undefined') {
    // @ts-ignore
    return __VITE_API_URL__;
  }
  
  // Fallback: try import.meta.env directly (Vite replaces this at build time)
  // This works because Vite processes this file when imported by frontend code
  try {
    // @ts-expect-error - import.meta exists in Vite builds but TypeScript doesn't allow it in CommonJS
    const meta = (globalThis as any)['import']?.meta;
    if (meta?.env?.VITE_API_URL) {
      return meta.env.VITE_API_URL;
    }
  } catch (e) {
    // Ignore
  }
  
  return 'http://localhost:4000';
})();