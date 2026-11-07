import React, { useState } from 'react';
import { ApiError } from './api';
import { useAuth } from './AuthContext';

type Mode = 'login' | 'register' | 'reset';
type Step = 'email' | 'code';

const Mark: React.FC = () => (
  <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true" className="text-amber-600">
    <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <path d="M10.5 20.5c3-.4 4.8-2.4 5.5-7 0.9 4.7 2.7 6.6 5.5 7" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

const field =
  'w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2.5 text-[13.5px] text-ink placeholder:text-stone-400 focus:border-stone-900 focus:outline-none';
const label = 'mb-1.5 block text-[12px] text-stone-500';

export const AuthScreen: React.FC = () => {
  const { login, requestRegister, verifyRegister, requestReset, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');

  const resetMessages = () => {
    setError(null);
    setInfo(null);
    setDevCode(null);
  };

  const switchMode = (next: Mode) => {
    resetMessages();
    setMode(next);
    setStep('email');
    setCode('');
    setPassword('');
    setConfirm('');
  };

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    resetMessages();
    try {
      await task();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof TypeError) setError('Сервер недоступен. Запустите API: cd project/server && npm run dev');
      else setError('Что-то пошло не так. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void run(() => login(email.trim(), password));
  };

  const submitRegisterEmail = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const result = await requestRegister(email.trim(), name.trim());
      setStep('code');
      setDevCode(result.devCode ?? null);
      setInfo(
        result.emailSent
          ? `Код отправлен на ${email.trim()} — проверьте почту.`
          : `Письма нет в dev-режиме: код показан ниже (${result.expiresInMinutes} минут).`
      );
    });
  };

  const submitRegisterCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Пароли не совпадают');
    void run(async () => {
      await verifyRegister(email.trim(), code.trim(), password);
    });
  };

  const submitResetEmail = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const result = await requestReset(email.trim());
      setStep('code');
      setDevCode(result.devCode ?? null);
      setInfo(
        result.emailSent
          ? `Код для восстановления отправлен на ${email.trim()}.`
          : `Письма нет в dev-режиме: код показан ниже (${result.expiresInMinutes} минут).`
      );
    });
  };

  const submitResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Пароли не совпадают');
    void run(async () => {
      await resetPassword(email.trim(), code.trim(), password);
      switchMode('login');
      setInfo('Пароль обновлён — войдите с новым паролем.');
    });
  };

  const passwordValid = password.length >= 8 && /\d/.test(password) && /[A-Za-zА-Яа-я]/.test(password);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto grid min-h-screen max-w-wrap grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Левая колонка */}
        <aside className="hidden flex-col justify-between border-r border-stone-200 bg-stone-50 px-12 py-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <Mark />
              <div>
                <div className="font-serif text-[21px] leading-none">Maison Lumière</div>
                <div className="mt-1.5 text-[11.5px] text-stone-500">ресторан на Патриарших · Малая Бронная, 4</div>
              </div>
            </div>

            <h1 className="mt-16 max-w-[15ch] font-serif text-[40px] leading-[1.12] text-ink">
              Бронь, журнал зала и схема — в одном месте
            </h1>
            <p className="mt-5 max-w-[38ch] text-[13.5px] leading-relaxed text-stone-600">
              Гостям — интерактивная схема и бронирование. Менеджеру — шахматка смены. Конструктору — планировка
              зала с ревизиями.
            </p>

            <ul className="mt-10 space-y-3 text-[12.5px] text-stone-600">
              <li>· вход по коду с почты, без лишних паролей при регистрации</li>
              <li>· отдельные сессии для каждого устройства</li>
              <li>· доступ по ролям: гость, менеджер, конструктор</li>
            </ul>
          </div>

          <p className="text-[11.5px] text-stone-500">
            © 2026 Maison Lumière · управление залом и бронированием
          </p>
        </aside>

        {/* Форма */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <Mark />
              <div>
                <div className="font-serif text-[19px] leading-none">Maison Lumière</div>
                <div className="mt-1 text-[11px] text-stone-500">бронирование и схема зала</div>
              </div>
            </div>

            <div className="mb-6 flex gap-6 border-b border-stone-200">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`-mb-px border-b-2 pb-2 text-[13.5px] transition-colors ${
                    mode === m ? 'border-amber-600 text-ink' : 'border-transparent text-stone-500 hover:text-ink'
                  }`}
                >
                  {m === 'login' ? 'Вход' : 'Регистрация'}
                </button>
              ))}
              {mode === 'reset' && (
                <span className="-mb-px border-b-2 border-amber-600 pb-2 text-[13.5px] text-ink">Восстановление</span>
              )}
            </div>

            {mode === 'login' && (
              <form onSubmit={submitLogin} className="space-y-4">
                <div>
                  <label className={label} htmlFor="login-email">Почта</label>
                  <input id="login-email" type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <label className={label} htmlFor="login-password">Пароль</label>
                  <input id="login-password" type="password" required autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13.5px] font-medium text-stone-50 transition-colors hover:bg-black disabled:opacity-50"
                >
                  {busy ? 'Входим…' : 'Войти'}
                </button>

                <div className="flex items-center justify-between text-[12px]">
                  <button type="button" onClick={() => switchMode('reset')} className="text-stone-500 underline-offset-2 hover:text-ink hover:underline">
                    Забыли пароль?
                  </button>
                  <button type="button" onClick={() => switchMode('register')} className="text-stone-500 underline-offset-2 hover:text-ink hover:underline">
                    Создать аккаунт
                  </button>
                </div>
              </form>
            )}

            {mode === 'register' && step === 'email' && (
              <form onSubmit={submitRegisterEmail} className="space-y-4">
                <div>
                  <label className={label} htmlFor="reg-name">Как к вам обращаться</label>
                  <input id="reg-name" required minLength={2} className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Алексей" />
                </div>
                <div>
                  <label className={label} htmlFor="reg-email">Почта</label>
                  <input id="reg-email" type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <p className="text-[11.5px] leading-relaxed text-stone-500">
                  Отправим шестизначный код. Аккаунт создаётся только после подтверждения почты.
                </p>
                <button type="submit" disabled={busy} className="w-full rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13.5px] font-medium text-stone-50 transition-colors hover:bg-black disabled:opacity-50">
                  {busy ? 'Отправляем код…' : 'Получить код'}
                </button>
              </form>
            )}

            {mode === 'register' && step === 'code' && (
              <form onSubmit={submitRegisterCode} className="space-y-4">
                <div>
                  <label className={label} htmlFor="reg-code">Код из письма</label>
                  <input
                    id="reg-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    className={`${field} tracking-[0.32em] tabular-nums`}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="reg-password">Пароль</label>
                  <input id="reg-password" type="password" required autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 8 символов и цифра" />
                  <p className={`mt-1.5 text-[11.5px] ${password && !passwordValid ? 'text-rose-800' : 'text-stone-500'}`}>
                    Не короче 8 символов, хотя бы одна буква и одна цифра.
                  </p>
                </div>
                <div>
                  <label className={label} htmlFor="reg-confirm">Повторите пароль</label>
                  <input id="reg-confirm" type="password" required autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={busy || !passwordValid} className="w-full rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13.5px] font-medium text-stone-50 transition-colors hover:bg-black disabled:opacity-50">
                  {busy ? 'Создаём аккаунт…' : 'Подтвердить и создать'}
                </button>
                <button type="button" onClick={() => { setStep('email'); resetMessages(); }} className="w-full text-[12px] text-stone-500 underline-offset-2 hover:text-ink hover:underline">
                  Изменить почту
                </button>
              </form>
            )}

            {mode === 'reset' && step === 'email' && (
              <form onSubmit={submitResetEmail} className="space-y-4">
                <div>
                  <label className={label} htmlFor="reset-email">Почта аккаунта</label>
                  <input id="reset-email" type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <p className="text-[11.5px] leading-relaxed text-stone-500">
                  Пришлём код, если аккаунт с такой почтой существует.
                </p>
                <button type="submit" disabled={busy} className="w-full rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13.5px] font-medium text-stone-50 transition-colors hover:bg-black disabled:opacity-50">
                  {busy ? 'Отправляем…' : 'Получить код'}
                </button>
                <button type="button" onClick={() => switchMode('login')} className="w-full text-[12px] text-stone-500 underline-offset-2 hover:text-ink hover:underline">
                  Вернуться ко входу
                </button>
              </form>
            )}

            {mode === 'reset' && step === 'code' && (
              <form onSubmit={submitResetCode} className="space-y-4">
                <div>
                  <label className={label} htmlFor="reset-code">Код из письма</label>
                  <input
                    id="reset-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    className={`${field} tracking-[0.32em] tabular-nums`}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="reset-password">Новый пароль</label>
                  <input id="reset-password" type="password" required autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 8 символов и цифра" />
                </div>
                <div>
                  <label className={label} htmlFor="reset-confirm">Повторите пароль</label>
                  <input id="reset-confirm" type="password" required autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={busy || !passwordValid} className="w-full rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13.5px] font-medium text-stone-50 transition-colors hover:bg-black disabled:opacity-50">
                  {busy ? 'Сохраняем…' : 'Сменить пароль'}
                </button>
                <button type="button" onClick={() => { setStep('email'); resetMessages(); }} className="w-full text-[12px] text-stone-500 underline-offset-2 hover:text-ink hover:underline">
                  Отправить код заново
                </button>
              </form>
            )}

            {info && <div className="mt-4 border-l-2 border-emerald-700 bg-emerald-50 px-3 py-2 text-[12px] leading-relaxed text-emerald-900">{info}</div>}
            {devCode && (
              <div className="mt-2 border border-dashed border-amber-500 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                Код для разработки: <b className="tracking-[0.2em]">{devCode}</b>
              </div>
            )}
            {error && <div className="mt-4 border-l-2 border-rose-700 bg-rose-50 px-3 py-2 text-[12px] leading-relaxed text-rose-900">{error}</div>}

            <p className="mt-8 text-[11px] leading-relaxed text-stone-500">
              Продолжая, вы соглашаетесь с политикой обработки данных ресторана. Код действует 10 минут,
              после пяти неверных попыток его нужно запросить заново.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
