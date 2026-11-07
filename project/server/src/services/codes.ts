import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../db';

export type Purpose = 'register' | 'reset';

export class CodeError extends Error {
  constructor(public code: 'CODE_NOT_FOUND' | 'CODE_EXPIRED' | 'CODE_INVALID' | 'CODE_ATTEMPTS', message: string) {
    super(message);
  }
}

const hashCode = (email: string, purpose: Purpose, code: string) =>
  crypto.createHmac('sha256', config.codeSecret).update(`${email.toLowerCase()}|${purpose}|${code}`).digest('hex');

const randomCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

/** Простой лимитер запросов кода: не более 5 за 10 минут на email. */
const issued = new Map<string, number[]>();
export const canIssueCode = (email: string) => {
  const key = email.toLowerCase();
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (issued.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= 5) return false;
  list.push(now);
  issued.set(key, list);
  return true;
};

export async function issueCode(email: string, purpose: Purpose, payload?: Record<string, unknown>) {
  const code = randomCode();
  const normalized = email.toLowerCase();

  await prisma.verificationCode.deleteMany({ where: { email: normalized, purpose, consumedAt: null } });
  await prisma.verificationCode.create({
    data: {
      email: normalized,
      purpose,
      codeHash: hashCode(normalized, purpose, code),
      payload: (payload ?? undefined) as Prisma.InputJsonValue | undefined,
      expiresAt: new Date(Date.now() + config.codeTtlMinutes * 60 * 1000),
    },
  });

  return code;
}

export async function verifyCode(email: string, purpose: Purpose, code: string) {
  const normalized = email.toLowerCase();
  const record = await prisma.verificationCode.findFirst({
    where: { email: normalized, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw new CodeError('CODE_NOT_FOUND', 'Код не найден. Запросите новый.');
  if (record.expiresAt.getTime() < Date.now()) throw new CodeError('CODE_EXPIRED', 'Код истёк. Запросите новый.');
  if (record.attempts >= config.codeMaxAttempts) throw new CodeError('CODE_ATTEMPTS', 'Слишком много попыток. Запросите новый код.');

  const valid = crypto.timingSafeEqual(
    Buffer.from(record.codeHash),
    Buffer.from(hashCode(normalized, purpose, code))
  );

  if (!valid) {
    await prisma.verificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    const left = Math.max(0, config.codeMaxAttempts - record.attempts - 1);
    throw new CodeError('CODE_INVALID', `Неверный код. Осталось попыток: ${left}.`);
  }

  await prisma.verificationCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return record;
}

export async function cleanupCodes() {
  await prisma.verificationCode.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}

export const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
};
