// Simple API client to talk to the new backend
import { API_URL } from '../server/src/config';
const API_BASE = import.meta.env.VITE_API_BASE || `${API_URL}/api`;

let token: string | null = null;

export function setToken(t: string) {
  token = t;
  localStorage.setItem('authToken', t);
}

export function loadToken() {
  token = localStorage.getItem('authToken');
  return token;
}

async function request(path: string, options: RequestInit = {}) {
  const headers: any = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  health: () => request('/health'),
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, role: 'student' | 'teacher', classId?: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role, classId }) }),
  quizzes: () => request('/quizzes'),
  quizById: (id: number) => request(`/quizzes/${id}`),
  submitQuiz: (id: number, answers: Record<number, string | boolean>) =>
    request(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  classStudents: (classId: string) => request(`/classes/${classId}/students`),
  messages: () => request('/messages'),
  badges: () => request('/badges')
};

export const rankingsApi = {
  byClass: (classId: string) => request(`/rankings?classId=${encodeURIComponent(classId)}`),
};

export const badgesApi = {
  getProgress: (studentId: string) => request(`/badges/${encodeURIComponent(studentId)}`),
};

export async function apiFindClassByCode(code: string) {
  const res = await fetch(`${API_URL}/api/classes?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error('Failed to lookup class by code');
  const arr = await res.json();
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

export async function apiJoinClass(classId: string, studentId: string) {
  const res = await fetch(`${API_URL}/api/class-students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId, studentId }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to join class'));
  return res.json();
}