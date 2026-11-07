import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api';

type Session = {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
};

const format = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const deviceName = (ua: string) => {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Браузер';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'устройство';
  return `${browser} · ${os}`;
};

export const SessionsPanel: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ sessions: Session[] }>('/auth/sessions');
      setSessions(data.sessions);
      setError(null);
    } catch {
      setError('Не удалось получить список сессий');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSessions(null);
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const revoke = async (id: string) => {
    setBusy(id);
    try {
      await api(`/auth/sessions/${id}`, { method: 'DELETE' });
      await load();
    } catch {
      setError('Не удалось завершить сессию');
    } finally {
      setBusy(null);
    }
  };

  const revokeOthers = async () => {
    setBusy('others');
    try {
      await api('/auth/sessions/revoke-others', { method: 'POST' });
      await load();
    } catch {
      setError('Не удалось завершить остальные сессии');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="sessions-title">
      <div className="w-full max-w-[560px] rounded-[3px] border border-stone-300 bg-stone-50">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5">
          <div>
            <h2 id="sessions-title" className="text-[20px] text-ink">Активные сессии</h2>
            <p className="mt-1 text-[12px] text-stone-500">Каждое устройство входит отдельно. Сессию можно завершить в любой момент.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-[2px] border border-stone-300 px-2 py-1 text-[13px] text-stone-600 hover:bg-stone-100">
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto px-6 py-4">
          {error && <div className="mb-3 border-l-2 border-rose-700 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">{error}</div>}

          {sessions === null && <p className="py-6 text-center text-[12.5px] text-stone-500">Загружаем сессии…</p>}

          {sessions?.length === 0 && <p className="py-6 text-center text-[12.5px] text-stone-500">Активных сессий нет.</p>}

          <ul className="divide-y divide-stone-200">
            {sessions?.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13px] text-ink">
                    <span className="truncate">{deviceName(s.userAgent)}</span>
                    {s.current && <span className="rounded-[2px] bg-emerald-50 px-1.5 py-0.5 text-[10.5px] text-emerald-800">это устройство</span>}
                  </div>
                  <div className="mt-1 text-[11.5px] text-stone-500">
                    IP {s.ip} · вход {format(s.createdAt)} · активность {format(s.lastUsedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy === s.id}
                  onClick={() => revoke(s.id)}
                  className="shrink-0 rounded-[2px] border border-stone-300 px-2.5 py-1 text-[11.5px] text-stone-700 transition-colors hover:bg-rose-50 hover:text-rose-800 disabled:opacity-50"
                >
                  {busy === s.id ? '…' : 'Завершить'}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-6 py-4">
          <button
            type="button"
            onClick={revokeOthers}
            disabled={busy === 'others' || !sessions || sessions.length < 2}
            className="rounded-[2px] border border-stone-300 px-3 py-2 text-[12.5px] text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-40"
          >
            Завершить другие сессии
          </button>
          <button type="button" onClick={onClose} className="rounded-[2px] bg-stone-900 px-4 py-2 text-[12.5px] font-medium text-stone-50 hover:bg-black">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
