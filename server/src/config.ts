const getFlag = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) ?? defaultValue;
};

export const REQUIRE_VERIFICATION =
  getFlag('requireVerification', 'false') === 'true';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';