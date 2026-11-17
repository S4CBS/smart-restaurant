const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';
const TOKEN_KEY = 'ml_access_token';

let accessToken: string | null = localStorage.getItem(TOKEN_KEY);

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; auth?: boolean; retry?: boolean };

async function raw(path: string, { method = 'GET', body, auth = true }: Options) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  let response = await raw(path, options);

  if (response.status === 401 && options.auth !== false && options.retry !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) response = await raw(path, { ...options, retry: false });
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'UNKNOWN', data.message ?? 'Ошибка запроса');
  }
  return data as T;
}

let refreshing: Promise<boolean> | null = null;

export async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const response = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!response.ok) return false;
        const data = await response.json();
        setAccessToken(data.accessToken ?? null);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}
