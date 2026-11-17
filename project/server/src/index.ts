import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, smtpConfigured } from './config';
import { authRouter } from './routes/auth';
import { prisma } from './db';
import { cleanupCodes } from './services/codes';

const app = express();

app.set('trust proxy', 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.webOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
  const db = await prisma.$queryRaw`SELECT 1`.then(() => 'up').catch(() => 'down');
  res.json({ ok: true, service: 'smart-restaurant-api', database: db, smtp: smtpConfigured ? 'configured' : 'dev-json' });
});

app.use('/api/auth', authRouter);

app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND', message: 'Маршрут не найден.' }));

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api]', error);
  res.status(500).json({ error: 'INTERNAL', message: 'Внутренняя ошибка сервера.' });
});

const server = app.listen(config.port, () => {
  console.info(`API: http://localhost:${config.port}`);
  console.info(`SMTP: ${smtpConfigured ? `${config.mail.host}:${config.mail.port}` : 'не настроен — коды пишутся в консоль'}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

setInterval(() => void cleanupCodes().catch(() => undefined), 60 * 60 * 1000).unref();
