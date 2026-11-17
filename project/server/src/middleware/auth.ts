import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/tokens';
import { prisma } from '../db';
import { touchSession } from '../services/sessions';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: string; sessionId: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Требуется вход в аккаунт.' });

  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: 'TOKEN_INVALID', message: 'Сессия истекла, войдите заново.' });

  const session = await prisma.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return res.status(401).json({ error: 'SESSION_REVOKED', message: 'Сессия завершена. Войдите заново.' });
  }

  req.user = { id: payload.sub, role: payload.role, sessionId: payload.sid };
  void touchSession(payload.sid);
  next();
}

export const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Недостаточно прав.' });
  }
  next();
};
