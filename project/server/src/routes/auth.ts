import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { config, smtpConfigured } from '../config';
import { sendCodeEmail } from '../services/mailer';
import { issueCode, verifyCode, CodeError, canIssueCode } from '../services/codes';
import {
  createSession,
  findActiveSession,
  refreshCookieOptions,
  revokeOtherSessions,
  revokeSession,
  rotateSession,
} from '../services/sessions';
import { signAccessToken } from '../services/tokens';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

const emailSchema = z.string().trim().toLowerCase().email('Введите корректный email');
const passwordSchema = z
  .string()
  .min(8, 'Пароль не короче 8 символов')
  .max(72, 'Пароль слишком длинный')
  .regex(/[A-Za-zА-Яа-я]/, 'Пароль должен содержать буквы')
  .regex(/\d/, 'Пароль должен содержать цифру');

const nameSchema = z.string().trim().min(2, 'Укажите имя').max(120);

const publicUser = (user: { id: string; name: string; email: string; role: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const fail = (res: Response, status: number, error: string, message: string) => res.status(status).json({ error, message });

const issueTokens = async (req: Request, res: Response, user: { id: string; name: string; email: string; role: string }) => {
  const { session, refreshToken } = await createSession(user.id, req);
  res.cookie('refresh_token', refreshToken, refreshCookieOptions);
  return {
    user: publicUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role, sid: session.id }),
    expiresIn: config.jwtTtlSeconds,
    sessionId: session.id,
  };
};

/* ------------------------------------------------------------------ регистрация */

authRouter.post('/register/request', async (req, res) => {
  const parsed = z.object({ email: emailSchema, name: nameSchema }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION', parsed.error.issues[0].message);
  const { email, name } = parsed.data;

  if (!canIssueCode(email)) return fail(res, 429, 'TOO_MANY_REQUESTS', 'Слишком много запросов кода. Попробуйте позже.');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail(res, 409, 'EMAIL_TAKEN', 'Аккаунт с такой почтой уже есть — войдите или восстановите пароль.');

  const code = await issueCode(email, 'register', { name });
  try {
    await sendCodeEmail(email, code, 'register', name);
  } catch (error) {
    console.error('[mail] не удалось отправить письмо', error);
    return fail(res, 502, 'MAIL_FAILED', 'Не удалось отправить письмо. Проверьте настройки SMTP.');
  }

  return res.json({
    ok: true,
    email,
    expiresInMinutes: config.codeTtlMinutes,
    emailSent: smtpConfigured,
    ...(config.devReturnCodes ? { devCode: code } : {}),
  });
});

authRouter.post('/register/verify', async (req, res) => {
  const parsed = z
    .object({ email: emailSchema, code: z.string().regex(/^\d{6}$/, 'Код — 6 цифр'), password: passwordSchema })
    .safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION', parsed.error.issues[0].message);
  const { email, code, password } = parsed.data;

  try {
    const record = await verifyCode(email, 'register', code);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail(res, 409, 'EMAIL_TAKEN', 'Аккаунт уже создан — войдите.');

    const payload = (record.payload ?? {}) as { name?: string };
    const user = await prisma.user.create({
      data: {
        email,
        name: payload.name?.trim() || email.split('@')[0],
        phone: `+7${Date.now()}${Math.floor(10 + Math.random() * 89)}`,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'guest',
      },
    });
    return res.status(201).json(await issueTokens(req, res, user));
  } catch (error) {
    if (error instanceof CodeError) return fail(res, 400, error.code, error.message);
    throw error;
  }
});

/* ------------------------------------------------------------------------ вход */

authRouter.post('/login', async (req, res) => {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION', parsed.error.issues[0].message);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return fail(res, 401, 'INVALID_CREDENTIALS', 'Неверная почта или пароль.');
  if (user.isBlocked) return fail(res, 403, 'BLOCKED', 'Аккаунт заблокирован администратором.');

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return fail(res, 401, 'INVALID_CREDENTIALS', 'Неверная почта или пароль.');

  return res.json(await issueTokens(req, res, user));
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined;
  if (!token) return fail(res, 401, 'NO_REFRESH', 'Нет активной сессии.');

  const session = await findActiveSession(token);
  if (!session) return fail(res, 401, 'SESSION_EXPIRED', 'Сессия истекла — войдите заново.');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.isBlocked) return fail(res, 401, 'SESSION_EXPIRED', 'Сессия недоступна.');

  const rotated = await rotateSession(session.id, req);
  res.cookie('refresh_token', rotated.refreshToken, refreshCookieOptions);
  return res.json({
    user: publicUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role, sid: session.id }),
    expiresIn: config.jwtTtlSeconds,
    sessionId: session.id,
  });
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  await revokeSession(req.user!.sessionId, req.user!.id);
  res.clearCookie('refresh_token', { ...refreshCookieOptions, maxAge: undefined });
  return res.json({ ok: true });
});

/* --------------------------------------------------------------------- профиль */

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return fail(res, 404, 'NOT_FOUND', 'Пользователь не найден.');
  return res.json({ user: publicUser(user), sessionId: req.user!.sessionId });
});

/* -------------------------------------------------------------------- сессии */

authRouter.get('/sessions', requireAuth, async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user!.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: [{ lastUsedAt: 'desc' }],
  });

  return res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent ?? 'Неизвестное устройство',
      ip: s.ip ?? '—',
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      current: s.id === req.user!.sessionId,
    })),
  });
});

authRouter.delete('/sessions/:id', requireAuth, async (req, res) => {
  const session = await prisma.session.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!session) return fail(res, 404, 'NOT_FOUND', 'Сессия не найдена.');
  await revokeSession(session.id, req.user!.id);
  if (session.id === req.user!.sessionId) {
    res.clearCookie('refresh_token', { ...refreshCookieOptions, maxAge: undefined });
  }
  return res.json({ ok: true });
});

authRouter.post('/sessions/revoke-others', requireAuth, async (req, res) => {
  await revokeOtherSessions(req.user!.id, req.user!.sessionId);
  return res.json({ ok: true });
});

/* ---------------------------------------------------------------- сброс пароля */

authRouter.post('/password/request', async (req, res) => {
  const parsed = z.object({ email: emailSchema }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION', parsed.error.issues[0].message);
  const { email } = parsed.data;

  if (!canIssueCode(email)) return fail(res, 429, 'TOO_MANY_REQUESTS', 'Слишком много запросов кода. Попробуйте позже.');

  const user = await prisma.user.findUnique({ where: { email } });
  const payload: Record<string, unknown> = {
    ok: true,
    email,
    expiresInMinutes: config.codeTtlMinutes,
    emailSent: false,
  };

  // Не раскрываем, есть ли аккаунт: письмо отправляем только при наличии пользователя.
  if (user) {
    const code = await issueCode(email, 'reset', { userId: user.id });
    try {
      await sendCodeEmail(email, code, 'reset', user.name);
      payload.emailSent = smtpConfigured;
      if (config.devReturnCodes) payload.devCode = code;
    } catch (error) {
      console.error('[mail] не удалось отправить письмо', error);
      return fail(res, 502, 'MAIL_FAILED', 'Не удалось отправить письмо. Проверьте настройки SMTP.');
    }
  }

  return res.json(payload);
});

authRouter.post('/password/reset', async (req, res) => {
  const parsed = z
    .object({ email: emailSchema, code: z.string().regex(/^\d{6}$/, 'Код — 6 цифр'), password: passwordSchema })
    .safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'VALIDATION', parsed.error.issues[0].message);
  const { email, code, password } = parsed.data;

  try {
    await verifyCode(email, 'reset', code);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail(res, 400, 'CODE_NOT_FOUND', 'Код не найден. Запросите новый.');

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    await prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    res.clearCookie('refresh_token', { ...refreshCookieOptions, maxAge: undefined });
    return res.json({ ok: true, message: 'Пароль обновлён. Войдите с новым паролем.' });
  } catch (error) {
    if (error instanceof CodeError) return fail(res, 400, error.code, error.message);
    throw error;
  }
});
