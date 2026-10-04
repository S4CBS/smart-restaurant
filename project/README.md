# Основной проект (Smart Restaurant)

Директория содержит исходный код сервиса: клиентскую часть, серверную часть и общие типы.

## 🏗 Архитектура каталогов

```
project/
├── client/          # Клиентское приложение (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/  # Общие UI-компоненты (в т.ч. <FloorPlanSVG>)
│   │   ├── modules/
│   │   │   ├── constructor/ # Интерактивный 2D-редактор схем залов
│   │   │   ├── booking/     # Гостевая витрина бронирования столов
│   │   │   └── manager/     # Шахматка и журнал броней
│   │   └── api/         # Клиентские API-запросы и сокеты
│   └── package.json
│
├── server/          # Серверное приложение (Node.js + TypeScript + Express)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/        # Регистрация, авторизация, JWT
│   │   │   ├── layout/      # Схемы залов, этажи, ревизии (JSONB)
│   │   │   ├── booking/     # Расчет слотов, бронирование, коллизии
│   │   │   └── users/       # Управление пользователями и ролями
│   │   ├── prisma/      # Схема базы данных Prisma ORM
│   │   └── sockets/     # Обработчики WebSocket комнат
│   └── package.json
│
└── shared/          # Общие интерфейсы, DTO и типы данных (TypeScript)
    └── types/       # Сущности Floor, Zone, Table, Reservation, Layout
```

## 🚀 Порядок запуска

1. **Сервер**:
   ```bash
   cd project/server
   npm install
   npx prisma migrate dev
   npm run dev
   ```

2. **Клиент**:
   ```bash
   cd project/client
   npm install
   npm run dev
   ```
