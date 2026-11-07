# Сервер (API + PostgreSQL + SMTP)

Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, JWT-сессии и отправка кодов на почту.

## 1. Установка

```bash
cd project/server
npm install
```

## 2. PostgreSQL

Нужна локальная база. Минимум:

```sql
CREATE DATABASE restaurant;
```

`DATABASE_URL` в `.env` (см. `.env.example`), например:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/restaurant?schema=public"
```

Применить схему:

```bash
npx prisma generate
npx prisma db push
```

## 3. Почта (Gmail)

1. Включите двухфакторную аутентификацию в Google-аккаунте.
2. Откройте https://myaccount.google.com/apppasswords и создайте пароль приложения (16 символов).
3. Заполните `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your@gmail.com
SMTP_PASS=xxxxxxxxxxxxxxxx   # пароль приложения, не пароль от почты
MAIL_FROM="Maison Lumière <your@gmail.com>"
```

Без SMTP сервер работает в dev-режиме: письма не уходят, код печатается в консоль и возвращается
в ответе API при `DEV_RETURN_CODES=true`.

## 4. Запуск

```bash
npm run dev        # http://localhost:4000
```

Проверка:

```bash
curl http://localhost:4000/api/health
```

## 5. Что реализовано

- `POST /api/auth/register/request` — письмо с кодом на почту.
- `POST /api/auth/register/verify` — код + пароль → аккаунт и сессия.
- `POST /api/auth/login` / `POST /api/auth/logout`.
- `POST /api/auth/refresh` — ротация refresh-токена (httpOnly cookie).
- `GET /api/auth/me`, `GET /api/auth/sessions`.
- `DELETE /api/auth/sessions/:id`, `POST /api/auth/sessions/revoke-others`.
- `POST /api/auth/password/request` и `POST /api/auth/password/reset` — восстановление по коду.
- JWT access (15 минут) + серверная сессия с refresh-токеном (30 дней), отзыв и истечение сессий.

Сессии хранятся в таблице `sessions` (хэш refresh-токена, устройство, IP, срок), коды — в
`verification_codes` (хэш кода, попытки, срок, одноразовое использование).
