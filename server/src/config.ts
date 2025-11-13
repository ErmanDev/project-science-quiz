// server/src/config.ts
const getFlag = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) ?? defaultValue;
};

export const REQUIRE_VERIFICATION =
  getFlag('requireVerification', 'false') === 'true';

// Direct API URL - no fallbacks
export const API_URL = 'https://project-science-quiz.onrender.com';