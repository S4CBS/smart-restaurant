# Constructor Inputs Template

Назначение: JSON-контракт между конструктором схем и бэкендом. Неделя 1 — только чтение (рендер без редактирования).

## Согласование

| Что | Кто |
|---|---|---|---|
| Термины | Илья (analyst) |
| Реализуемость полей | Леха (backend) |
| Contract-тесты | Иван (QA) |


## 1. Общая структура

```json
{
  "templateVersion": "0.1",
  "floor": {},
  "zones": [],
  "tables": [],
  "validationRules": {},
  "openQuestions": []
}
```

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| `templateVersion` | string | да | Версия шаблона (`0.1`, `1.0`, …) |
| `floor` | object | да | Этаж (см. п.2) |
| `zones` | array\<Zone\> | да | Зоны на этаже |
| `tables` | array\<Table\> | да | Столы на этаже |
| `validationRules` | object | да | Правила валидации (см. п.5) |
| `openQuestions` | array\<Question\> | нет | Открытые вопросы (см. п.6) |

---

## 2. Floor

| Поле | Тип | Обязательное | Ограничения |
|---|---|---|---|
| `id` | string (uuid) | да | — |
| `number` | integer | да | Уникален в рамках заведения, ≥ 0 |
| `name` | string | нет | До 100 символов |
| `width` | number | да | > 0, в пикселях |
| `height` | number | да | > 0, в пикселях |

```json
{
  "id": "floor-uuid-1",
  "number": 1,
  "name": "Первый этаж",
  "width": 1200,
  "height": 800
}
```

---

## 3. Zone

| Поле | Тип | Обязательное | Ограничения |
|---|---|---|---|
| `id` | string (uuid) | да | — |
| `name` | string | да | До 100 символов |
| `type` | string (enum) | да | `main`, `bar`, `terrace`, `vip`, `banquet`, `navigation`, `technical` |
| `polygon` | array\<Point\> | да | ≥ 3 вершины, без самопересечений |
| `color` | string (hex) | нет | `#RRGGBB` |
| `isActive` | boolean | да | — |
| `isReservable` | boolean | да | — |
| `sortOrder` | integer | нет | Порядок отрисовки, ≥ 0 |

`Point`: `{ "x": number, "y": number }`

```json
{
  "id": "zone-uuid-1",
  "name": "Основной зал",
  "type": "main",
  "polygon": [
    { "x": 0, "y": 0 },
    { "x": 800, "y": 0 },
    { "x": 800, "y": 600 },
    { "x": 0, "y": 600 }
  ],
  "color": "#E0E0E0",
  "isActive": true,
  "isReservable": true,
  "sortOrder": 1
}
```

---

## 4. Table

| Поле | Тип | Обязательное | Ограничения |
|---|---|---|---|
| `id` | string (uuid) | да | — |
| `zoneId` | string (uuid) | да | Должен ссылаться на зону из этого же payload |
| `number` | string | да | Уникален в рамках этажа |
| `seats` | integer | да | > 0 |
| `shape` | string (enum) | да | `round`, `square`, `rect` |
| `x` | number | да | ≥ 0 |
| `y` | number | да | ≥ 0 |
| `w` | number | да | > 0 |
| `h` | number | да | > 0 |
| `rotation` | number | да | `[0, 360)` |
| `isReservable` | boolean | да | — |

```json
{
  "id": "table-uuid-1",
  "zoneId": "zone-uuid-1",
  "number": "T-01",
  "seats": 4,
  "shape": "square",
  "x": 150,
  "y": 200,
  "w": 80,
  "h": 80,
  "rotation": 0,
  "isReservable": true
}
```

---

## 5. validationRules

Формализованные правила — чтобы QA писал contract-тесты по ним, а бэкенд не дублировал логику.

```json
{
  "polygon": "min 3 vertices, no self-intersections",
  "rotation": "[0, 360)",
  "seats": "> 0",
  "w": "> 0",
  "h": "> 0",
  "table.number": "unique within floor",
  "table.zoneId": "must reference a zone in this payload",
  "floor.number": "unique, >= 0"
}
```

---

## 6. openQuestions

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| `id` | string | да | `Q-01`, `Q-02`, … |
| `text` | string | да | Формулировка вопроса |
| `owner` | string | да | Кто отвечает |
| `deadline` | string (date) | да | Когда нужен ответ |
| `status` | string (enum) | да | `open`, `resolved`, `rejected` |

```json
[
  {
    "id": "Q-01",
    "text": "Нужна ли поддержка многоэтажности в v1?",
    "owner": "Илья",
    "deadline": "2026-11-14",
    "status": "open"
  },
  {
    "id": "Q-02",
    "text": "Разрешаем ли пересечение столов между зонами?",
    "owner": "Илья",
    "deadline": "2026-11-14",
    "status": "open"
  }
]
```

---

## 7. Полный валидный пример

```json
{
  "templateVersion": "0.1",
  "floor": {
    "id": "floor-uuid-1",
    "number": 1,
    "name": "Первый этаж",
    "width": 1200,
    "height": 800
  },
  "zones": [
    {
      "id": "zone-uuid-1",
      "name": "Основной зал",
      "type": "main",
      "polygon": [
        { "x": 0, "y": 0 },
        { "x": 800, "y": 0 },
        { "x": 800, "y": 600 },
        { "x": 0, "y": 600 }
      ],
      "color": "#E0E0E0",
      "isActive": true,
      "isReservable": true,
      "sortOrder": 1
    }
  ],
  "tables": [
    {
      "id": "table-uuid-1",
      "zoneId": "zone-uuid-1",
      "number": "T-01",
      "seats": 4,
      "shape": "square",
      "x": 150,
      "y": 200,
      "w": 80,
      "h": 80,
      "rotation": 0,
      "isReservable": true
    },
    {
      "id": "table-uuid-2",
      "zoneId": "zone-uuid-1",
      "number": "T-02",
      "seats": 2,
      "shape": "round",
      "x": 300,
      "y": 200,
      "w": 60,
      "h": 60,
      "rotation": 0,
      "isReservable": true
    }
  ],
  "validationRules": {
    "polygon": "min 3 vertices, no self-intersections",
    "rotation": "[0, 360)",
    "seats": "> 0",
    "w": "> 0",
    "h": "> 0",
    "table.number": "unique within floor",
    "table.zoneId": "must reference a zone in this payload",
    "floor.number": "unique, >= 0"
  },
  "openQuestions": [
    {
      "id": "Q-01",
      "text": "Нужна ли поддержка многоэтажности в v1?",
      "owner": "Илья",
      "deadline": "2026-11-14",
      "status": "open"
    }
  ]
}
```

---

## 8. Пример с ошибкой (что считается невалидным)

```json
{
  "templateVersion": "0.1",
  "floor": { "id": "floor-uuid-1", "number": -1, "width": 0, "height": 800 },
  "zones": [
    {
      "id": "zone-uuid-1",
      "name": "Зал",
      "type": "unknown_type",
      "polygon": [ { "x": 0, "y": 0 }, { "x": 100, "y": 100 } ],
      "isActive": true,
      "isReservable": true
    }
  ],
  "tables": [
    {
      "id": "table-uuid-1",
      "zoneId": "zone-does-not-exist",
      "number": "T-01",
      "seats": 0,
      "shape": "triangle",
      "x": -10,
      "y": 200,
      "w": 80,
      "h": 80,
      "rotation": 400,
      "isReservable": true
    }
  ],
  "validationRules": {},
  "openQuestions": []
}
```

**Нарушения:**

| # | Поле | Что не так |
|---|---|---|
| 1 | `floor.number` | `-1` — должно быть ≥ 0 |
| 2 | `floor.width` | `0` — должно быть > 0 |
| 3 | `zone.type` | `unknown_type` — не из enum |
| 4 | `zone.polygon` | 2 вершины — нужно ≥ 3 |
| 5 | `table.zoneId` | ссылается на несуществующую зону |
| 6 | `table.seats` | `0` — должно быть > 0 |
| 7 | `table.shape` | `triangle` — не из enum |
| 8 | `table.x` | `-10` — должно быть ≥ 0 |
| 9 | `table.rotation` | `400` — вне `[0, 360)` |

---

## 9. Что НЕ входит в шаблон недели 1

- Редактирование (drag&drop, поворот, resize) — неделя 2.
- Публикация ревизий (`LayoutRevision`) — неделя 3.
- Бронирования и проверка конфликтов — недели 2–3.
- Аутентификация и роли — неделя 2.
- Многоэтажность как массив `floors[]` — под вопросом (см. Q-01).

---

## 10. Ссылки

- Глоссарий: `workspaces/cruddykot/constructor-scope-draft.md` (Илья)
- Риски и test approach: `workspaces/Faust-hi/` (Иван)
- ADR по стеку: репозиторий backend (Леха)
