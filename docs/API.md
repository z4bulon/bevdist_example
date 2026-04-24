# API Reference

**Base URL (dev):** `http://localhost:3000/api`  
**Auth:** сессионный JWT через NextAuth — устанавливается после логина на `/auth/login`  
**Content-Type:** `application/json`

Все ответы оборачиваются в единый конверт:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "описание ошибки" }
```

---

## Auth

### POST /api/auth/register

Регистрация нового CLIENT-аккаунта. Публичный, авторизация не нужна.

```json
{
  "name":     "Айдар Сейткали",
  "email":    "aidar@store.kz",
  "password": "secret123",
  "company":  "Магазин №5",
  "phone":    "+7 700 000 0000"
}
```
`phone` — необязательное.

| Код | Что значит |
|-----|------------|
| 201 | Создан — возвращает `{ id, email, name, company, role }` |
| 409 | Email уже занят |
| 422 | Ошибка валидации, сообщение покажет какое именно поле |

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@store.kz","password":"pass123","company":"ТОО Test"}'
```

### POST /api/auth/callback/credentials

Это NextAuth. Принимает `email` + `password`, ставит куку `authjs.session-token`. Напрямую через fetch обычно не вызывается — используй `signIn()` из `next-auth/react`.

---

## Products

### GET /api/products

Список активных товаров. Публичный GET — не нужна авторизация (для будущей интеграции с внешними системами).

| Параметр | По умолчанию | Описание |
|----------|-------------|----------|
| `search` | `""` | Поиск по названию и описанию, case-insensitive |
| `category` | `""` | Slug категории, например `sodas` |
| `page` | `1` | Страница |
| `limit` | `20` | Размер страницы, максимум 50 |

```json
{
  "products": [
    {
      "id": "clx...",
      "name": "Coca-Cola 1L (ящик 12 шт.)",
      "price": "4800.00",
      "stock": 200,
      "unit": "ящик",
      "category": { "id": "...", "name": "Газировки", "slug": "sodas" }
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 20
}
```

```bash
curl "http://localhost:3000/api/products?search=cola&category=sodas"
```

### POST /api/products — *ADMIN*

Создать товар.

```json
{
  "name":       "Pepsi 1.5L (ящик 6 шт.)",
  "price":      3200,
  "stock":      150,
  "unit":       "ящик",
  "categoryId": "clx...",
  "description": "необязательно",
  "imageUrl":   "https://... (необязательно)"
}
```

### GET /api/products/:id

Один товар по ID. Публичный.

### PATCH /api/products/:id — *ADMIN*

Частичное обновление — все поля опциональны: `name`, `description`, `price`, `stock`, `unit`, `categoryId`, `imageUrl`, `isActive`.

### DELETE /api/products/:id — *ADMIN*

Soft-delete: ставит `isActive = false`. Строку из БД не удаляем — иначе сломаются старые заказы, которые ссылаются на товар.

---

## Categories

### GET /api/categories

Все категории, отсортированные по имени. Публичный.

```json
[{ "id": "...", "name": "Газировки", "slug": "sodas" }, ...]
```

---

## Cart

### GET /api/cart — *auth*

Корзина текущего пользователя с вложенными товарами.

```json
[
  {
    "id": "...",
    "quantity": 3,
    "product": {
      "name": "Coca-Cola 1L",
      "price": "4800.00",
      "unit": "ящик",
      "category": { "name": "Газировки" }
    }
  }
]
```

### POST /api/cart — *auth*

Добавить или обновить позицию. Если `quantity: 0` — удалить.

```json
{ "productId": "clx...", "quantity": 2 }
```

### DELETE /api/cart — *auth*

Очистить корзину полностью.

---

## Orders

### GET /api/orders — *auth*

CLIENT видит только свои заказы, ADMIN — все.

| Параметр | Описание |
|----------|----------|
| `status` | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `page` | страница, по умолчанию 1 |
| `limit` | размер страницы, по умолчанию 10, максимум 50 |

### POST /api/orders — *auth: CLIENT*

Оформить заказ из корзины. Всё происходит в одной транзакции:
- создаётся `Order` + `OrderItem` со снимком цены на момент оформления
- списывается остаток по каждому товару
- корзина очищается

```json
{ "notes": "комментарий к заказу — необязательно" }
```

> Цена фиксируется в `OrderItem.unitPrice` — если позже изменить цену товара, старые заказы не пересчитываются.

| Код | Ситуация |
|-----|----------|
| 201 | Заказ создан |
| 400 | Корзина пуста |
| 409 | Не хватает остатка на складе |

### GET /api/orders/:id — *auth*

Детали заказа. CLIENT может смотреть только свои, ADMIN — любой.

### PATCH /api/orders/:id — *ADMIN*

Обновить статус.

```json
{ "status": "CONFIRMED" }
```

Логика переходов не проверяется на уровне API — можно, например, сразу поставить DELIVERED. Если нужно ограничить — добавить валидацию в `orderStatusSchema`.

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
        ↘ CANCELLED (из любого состояния)
```

---

## Admin

### GET /api/admin/orders/export — *ADMIN*

Скачать заказы в CSV. Файл отдаётся с BOM (UTF-8) — Excel открывает без кракозябров.

| Параметр | Описание |
|----------|----------|
| `status` | Опциональный фильтр. Без него — все заказы. |

**Колонки:** ID, Дата, Клиент, Компания, Email, Товаров, Сумма (₸), Статус

```bash
# Скачать все доставленные заказы
curl -b "authjs.session-token=..." \
  "http://localhost:3000/api/admin/orders/export?status=DELIVERED" \
  -o orders.csv
```

Имя файла автоматически включает статус и timestamp: `orders-DELIVERED-1714900000000.csv`.

---

## Коды ответов

| Код | Когда |
|-----|-------|
| 200 | OK |
| 201 | Создано |
| 400 | Неверный запрос (пустая корзина и т.п.) |
| 401 | Не авторизован |
| 403 | Недостаточно прав |
| 404 | Не найдено |
| 409 | Конфликт (email занят, нет остатка) |
| 422 | Ошибка валидации Zod — в `error` будет человекочитаемое описание |
| 500 | Что-то пошло не так на сервере |

---

## Логирование

Ключевые API-роуты (`/api/orders`, `/api/products`) пишут в stdout время ответа:

```
[2026-04-09T10:23:11.042Z] [INFO ] POST /api/orders → 201 (87ms)
[2026-04-09T10:23:15.500Z] [WARN ] Validation error [POST /api/products] {"details":"price: Expected number"}
[2026-04-09T10:23:18.800Z] [ERROR] Unhandled exception [GET /api/orders] {"message":"..."}
```

Инициализируется через `startTimer()` из `src/lib/logger.ts`.

---

## Архитектура (кратко)

```
Браузер  →  Next.js Edge Middleware (JWT проверка)  →  App Router
                                                         ├── Server Components → Prisma → PostgreSQL
                                                         └── API Routes        → Prisma → PostgreSQL
```

Подробнее про выбор стека — в README.
