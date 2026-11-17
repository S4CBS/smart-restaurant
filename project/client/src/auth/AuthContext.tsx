import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken, tryRefresh } from './api';

export type AuthUser = { id: string; name: string; email: string; role: string };

type AuthResponse = { accessToken: string; user: AuthUser; expiresIn: number; sessionId: string };

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestRegister: (email: string, name: string) => Promise<{ devCode?: string; emailSent: boolean; expiresInMinutes: number }>;
  verifyRegister: (email: string, code: string, password: string) => Promise<void>;
  requestReset: (email: string) => Promise<{ devCode?: string; emailSent: boolean; expiresInMinutes: number }>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await tryRefresh();
        if (!refreshed) return;
        const me = await api<{ user: AuthUser }>('/auth/me');
        if (!cancelled) setUser(me.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const requestRegister = useCallback(async (email: string, name: string) => {
    return api<{ devCode?: string; emailSent: boolean; expiresInMinutes: number }>('/auth/register/request', {
      method: 'POST',
      body: { email, name },
      auth: false,
    });
  }, []);

  const verifyRegister = useCallback(async (email: string, code: string, password: string) => {
    const data = await api<AuthResponse>('/auth/register/verify', {
      method: 'POST',
      body: { email, code, password },
      auth: false,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const requestReset = useCallback(async (email: string) => {
    return api<{ devCode?: string; emailSent: boolean; expiresInMinutes: number }>('/auth/password/request', {
      method: 'POST',
      body: { email },
      auth: false,
    });
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, password: string) => {
    await api('/auth/password/reset', { method: 'POST', body: { email, code, password }, auth: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api<{ user: AuthUser }>('/auth/me');
    setUser(me.user);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, requestRegister, verifyRegister, requestReset, resetPassword, logout, refreshUser }),
    [user, ready, login, requestRegister, verifyRegister, requestReset, resetPassword, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
