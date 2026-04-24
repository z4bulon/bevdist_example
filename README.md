# BevDist — B2B Order Management Platform

**Stack:** Next.js 15 (App Router), TypeScript, Prisma ORM, PostgreSQL, NextAuth v5, Tailwind CSS, shadcn/ui

---

## Описание

Веб-платформа для автоматизации оптовых заказов между розничными магазинами и дистрибьютором напитков.

**Роли:**
- **Клиент (магазин)** — просматривает каталог, добавляет товары в корзину, оформляет и отслеживает заказы
- **Администратор** — управляет товарами и категориями, обрабатывает заказы, меняет статусы, выгружает отчёты

**Основной функционал:**
- Каталог с поиском, фильтрацией по категориям и infinite scroll
- Корзина с обновлением количества в реальном времени
- Оформление заказа с фиксацией цен на момент покупки
- История заказов, повтор заказа одним кликом
- Админ-панель: управление товарами, обработка заказов, экспорт в CSV
- Аутентификация через email + пароль (JWT-сессии)

---

## Быстрый старт

1. Клонируйте репозиторий
2. Скопируйте `.env.example` → `.env` и заполните переменные:
   ```
   DATABASE_URL=postgresql://...
   AUTH_SECRET=<random string>
   ```
3. Установите зависимости:
   ```bash
   npm install
   ```
4. Примените схему и наполните тестовыми данными:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Запустите:
   ```bash
   npm run dev
   ```
6. Откройте [http://localhost:3000](http://localhost:3000)

## Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@bevdist.kz | admin123 |
| Клиент | client@store.kz | client123 |

---

## Структура проекта

```
src/
├── app/
│   ├── (app)/              # Защищённые маршруты (layout с Navbar)
│   │   ├── admin/          # Панель администратора
│   │   ├── catalog/        # Каталог товаров
│   │   ├── cart/           # Корзина
│   │   └── orders/         # История заказов
│   ├── api/                # REST API
│   │   ├── admin/orders/export/  # Экспорт в CSV
│   │   ├── auth/           # Регистрация + NextAuth
│   │   ├── cart/
│   │   ├── orders/
│   │   └── products/
│   └── auth/               # Публичные страницы входа/регистрации
├── components/
│   ├── layout/             # Navbar
│   ├── orders/             # OrderStatusBadge
│   └── ui/                 # Button, Input, Toast и др.
├── lib/
│   ├── auth.ts / auth.config.ts
│   ├── guards.ts           # requireAuth / requireAdmin
│   ├── prisma.ts
│   ├── schemas.ts          # Zod-схемы
│   └── utils.ts
└── types/
    └── auth.ts             # AuthUser
```

---

## Документация

- API: [docs/API.md](docs/API.md)

---

## Архитектура

- **Next.js 15 App Router** — SSR для каталога и заказов, Client Components для интерактивных форм
- **Prisma ORM** — типобезопасные запросы, миграции, `$transaction` для атомарного оформления заказа
- **NextAuth v5** — JWT-стратегия, Edge-compatible middleware
- **Tailwind CSS + shadcn/ui** — утилитарные стили без runtime-оверхеда

---

© 2026 BevDist
