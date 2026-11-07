import type { Request } from 'express';
import { prisma } from '../db';
import { createRefreshToken, hashRefreshToken, refreshExpiresAt } from './tokens';
import { config } from '../config';

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
  maxAge: config.refreshTtlDays * 24 * 60 * 60 * 1000,
};

const clientMeta = (req: Request) => ({
  userAgent: (req.headers['user-agent'] ?? '').slice(0, 300),
  ip: (req.ip ?? req.socket.remoteAddress ?? '').slice(0, 64),
});

export async function createSession(userId: string, req: Request) {
  const token = createRefreshToken();
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(token),
      ...clientMeta(req),
      expiresAt: refreshExpiresAt(),
    },
  });
  return { session, refreshToken: token };
}

export async function findActiveSession(refreshToken: string) {
  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hashRefreshToken(refreshToken) } });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  return session;
}

export async function rotateSession(sessionId: string, req: Request) {
  const token = createRefreshToken();
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      refreshTokenHash: hashRefreshToken(token),
      lastUsedAt: new Date(),
      expiresAt: refreshExpiresAt(),
      ...clientMeta(req),
    },
  });
  return { session, refreshToken: token };
}

export async function touchSession(sessionId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
}

export async function revokeSession(sessionId: string, userId: string) {
  await prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeOtherSessions(userId: string, keepSessionId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null, id: { not: keepSessionId } },
    data: { revokedAt: new Date() },
  });
}
