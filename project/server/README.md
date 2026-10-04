# Server (Бэкенд проекта)

Серверная часть сервиса на **Node.js + TypeScript (Express / NestJS) + PostgreSQL**.

## 🎯 Основные модули
- `auth`: регистрация, аутентификация, валидация JWT access/refresh токенов, ролевой доступ (RBAC).
- `layout`: CRUD этажей, зон, столов; сохранение снимков планировки в JSONB (`LayoutRevision`), валидация целостности схемы перед публикацией.
- `booking`: расчет свободных слотов с учетом 15-минутного буфера подготовки стола, предотвращение овербукинга, управление жизненным циклом бронирования.
- `sockets`: WebSocket шлюз на Socket.IO (комнаты `layout:edit` для soft-lock редактирования схемы и `booking:updates` для live-синхронизации броней).

## 🛠 Технологии
- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- Socket.IO
- Vitest / Supertest
