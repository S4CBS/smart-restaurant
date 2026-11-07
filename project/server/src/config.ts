import 'dotenv/config';

const bool = (value: string | undefined, fallback = false) =>
  value == null ? fallback : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/restaurant?schema=public',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 900),
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS ?? 30),
  codeSecret: process.env.CODE_SECRET ?? 'dev-code-secret-change-me',
  codeTtlMinutes: Number(process.env.CODE_TTL_MINUTES ?? 10),
  codeMaxAttempts: Number(process.env.CODE_MAX_ATTEMPTS ?? 5),
  devReturnCodes: bool(process.env.DEV_RETURN_CODES, true),
  webOrigins: (process.env.WEB_ORIGINS ?? 'http://localhost:3000,http://localhost:4173,http://localhost:5177,http://127.0.0.1:4173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: bool(process.env.SMTP_SECURE, true),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'Maison Lumière <no-reply@maison-lumiere.ru>',
  },
};

export const smtpConfigured = Boolean(config.mail.host && config.mail.user && config.mail.pass);
