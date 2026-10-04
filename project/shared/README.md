# Shared (Общие типы и контракты)

Общие типы данных, DTO и интерфейсы TypeScript, используемые совместно фронтендом (`client`) и бэкендом (`server`).

## 🎯 Содержимое
- `Floor`, `Zone`, `Table` — типы сущностей схемы зала.
- `Reservation` — тип сущности бронирования и статусы (`confirmed`, `completed`, `cancelled`, `no_show`).
- `LayoutRevisionPayload` — каноническая структура JSON-снимка схемы зала.
- `UserRole` — enum ролей (`guest`, `constructor`, `manager`, `admin`).
