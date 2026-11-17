import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config';

export type AccessPayload = {
  sub: string;
  role: string;
  sid: string;
};

export const signAccessToken = (payload: AccessPayload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtTtlSeconds });

export const verifyAccessToken = (token: string): AccessPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as AccessPayload;
  } catch {
    return null;
  }
};

/** Случайный refresh-токен: в БД хранится только его SHA-256. */
export const createRefreshToken = () => crypto.randomBytes(48).toString('base64url');

export const hashRefreshToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const refreshExpiresAt = () => new Date(Date.now() + config.refreshTtlDays * 24 * 60 * 60 * 1000);
