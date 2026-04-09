import { getAuthBaseUrl } from '../config/apiBaseUrl';

const TIMEOUT_MS = 20_000;

function messageFromBody(body: string, fallback: string): string {
  try {
    const decoded = JSON.parse(body) as Record<string, unknown>;
    if (typeof decoded.message === 'string' && decoded.message.length > 0) {
      return decoded.message;
    }
    const errors = decoded.errors;
    if (errors && typeof errors === 'object') {
      const lines: string[] = [];
      for (const v of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          for (const item of v) {
            if (typeof item === 'string') lines.push(item);
          }
        } else if (typeof v === 'string') {
          lines.push(v);
        }
      }
      if (lines.length > 0) return lines.join(' ');
    }
    if (typeof decoded.title === 'string' && decoded.title.length > 0) return decoded.title;
    if (typeof decoded.detail === 'string' && decoded.detail.length > 0) return decoded.detail;
  } catch {
    /* ignore */
  }
  const t = body.trim();
  if (t.length > 0 && t.length < 400 && !t.startsWith('<')) return t;
  return fallback;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
};

export const authApi = {
  async register(params: {
    fullName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<void> {
    const base = getAuthBaseUrl();
    const res = await fetchWithTimeout(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: params.fullName,
        email: params.email,
        password: params.password,
        role: params.role,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(messageFromBody(text, 'Registration failed'));
    }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const base = getAuthBaseUrl();
    const res = await fetchWithTimeout(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(messageFromBody(text, 'Login failed'));
    }
    return JSON.parse(text) as LoginResponse;
  },

  async deleteAccount(token: string, password: string): Promise<void> {
    const base = getAuthBaseUrl();
    const res = await fetchWithTimeout(`${base}/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(messageFromBody(text, 'Delete account failed'));
    }
  },
};
