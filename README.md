# CloudNode VPN Bot

⚡️ Быстрый и стабильный VPN прямо в Telegram. Поддержка ПК, телефонов, телевизоров.

## Production Ready

- **GitOps деплой** через GitLab CI/CD
- **Мультинодная инфраструктура** с атомарным деплоем
- **VLESS + Reality** протокол через Marzban
- **BullMQ** для асинхронных задач

## Архитектура (Clean Architecture)

```
src/
├── app.module.ts              # Корневой модуль
├── main.ts                    # Точка входа
├── shared/                    # Общие сервисы
│   ├── prisma/                # Prisma ORM
│   ├── config/                # Конфигурация
│   ├── encryption/            # Шифрование
│   └── health/                # Health check
├── modules/                   # Domain модули
│   ├── users/                 # Пользователи
│   ├── rentals/               # Аренда подписок
│   ├── payments/              # Платежи (заглушка)
│   ├── bot/                   # Telegram Bot
│   └── integrations/          # Внешние интеграции
│       ├── queue/             # BullMQ очереди
│       └── providers/         # Marzban API
└── prisma/
    └── schema.prisma          # Схема БД
```

## Ключевые паттерны

### 1. Command Pattern с Map-based роутингом
```typescript
@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = ['start', 'back_to_start'];

  async execute(context: CommandContext): Promise<void> {
    // Логика команды
  }
}
```

BotActionsService использует Map для O(1) поиска команд:
```typescript
private patternHandlers = new Map<string, BaseAction>();

registerHandler(handler: BaseAction): void {
  this.registerPatterns(handler);
}
```

### 2. Repository Pattern
```typescript
// UsersRepository — изоляция доступа к User
// RentalsRepository — изоляция доступа к Rental
// telegramId конвертируется в BigInt автоматически
```

### 3. Strict Module Boundaries
- `UsersModule` и `RentalsModule` не зависят от Telegram API
- `BotModule` является единственным адаптером для Telegram
- Все модули используют Shared слой для инфраструктуры

## Технологии

- **NestJS** — фреймворк
- **nestjs-telegraf** — Telegram Bot API
- **Prisma ORM** — PostgreSQL
- **BullMQ** — очереди задач (Redis)
- **Marzban** — VPN панель (VLESS/Reality)
- **Joi** — валидация конфигурации

## GitOps Деплой (Production)

### Требуемые переменные GitLab CI/CD

```env
# Обязательные
TELEGRAM_BOT_TOKEN=
DB_PASSWORD=
REDIS_PASSWORD=
ENCRYPTION_KEY=

# Инфраструктура
SERVER_IP=                    # Master node
INFRASTRUCTURE_IP_LIST=       # Node1,Node2 (через запятую)
SSH_PRIVATE_KEY=              # Доступ к нодам
SERVER_USER=                  # root (default)

# Marzban VPN
VPN_ADMIN_USERNAME=
VPN_ADMIN_PASSWORD=
DOMAIN_NAME=

# VLESS + Reality Inbound (опциональные)
REALITY_PRIVATE_KEY=          # Приватный ключ Reality (генерируется xray)
REALITY_SHORT_ID=              # Short ID для Reality (по умолчанию: abcd1234)
MARZBAN_INBOUND_TAG=           # Тег инбаунда (по умолчанию: VLESS_REALITY)

# Docker Registry
CI_REGISTRY_USER=
CI_REGISTRY_PASSWORD=
```

### Деплой

```bash
git push origin main  # Автоматический деплой на все ноды
```

## Health Check

```
GET http://localhost:3000/health
```

## Отказоустойчивость

- **Атомарный деплой** — если одна нода падает, пайплайн фейлится
- **BullMQ retry** — 9 попыток для provisioning задач
- **Graceful degradation** — бот работает даже при проблемах с VPN API

## Команды бота

### Меню (кнопка [ МЕНЮ ])
- `/start` — Главное меню
- `/support` — Поддержка

### Инлайн-кнопки
- **🚀 Быстрый старт** — Получить/продлить ключ
- **🧭 Как подключить** — Инструкции для iOS/Android/Windows/macOS
- **🤝 Партнёрам** — Реферальная программа
- **⚖️ Условия** — FAQ, поддержка ВК, условия сервиса

## Добавление новой команды

```typescript
// 1. Создайте класс команды
@Injectable()
export class MyCommand extends BaseAction {
  readonly pattern = 'my_action'; // или RegExp

  async execute(context: CommandContext): Promise<void> {
    const { ctx } = context;
    await ctx.reply('Hello!');
  }
}

// 2. Добавьте в commandHandlers в bot.module.ts
const commandHandlers = [
  // ... существующие команды
  MyCommand, // ← только здесь
];
```

**BotActionsService не требует изменений** — Open/Closed Principle в действии!

## Структура данных

### User
```typescript
{
  id: number;
  telegramId: bigint;
  username?: string;
  firstName?: string;
  status: 'active' | 'expired';
  subscriptionType: 'free' | 'premium';
  expiresAt?: Date;
  rentals: Rental[];
}
```

### Rental
```typescript
{
  id: number;
  userId: number;
  term: number;           // срок в месяцах
  status: 'pending' | 'active' | 'expired';
  startDate?: Date;
  endDate?: Date;
}
```

## Будущие улучшения

- [x] Интеграция Prisma ORM
- [x] Clean Architecture рефакторинг
- [x] Command/Handler паттерн
- [x] Модульная система UI
- [x] Map-based роутинг команд
- [x] Joi валидация конфигурации
- [x] BullMQ для очередей задач
- [x] VPN-конфигурации VLESS + Reality
- [ ] Платежная интеграция (Stripe/Crypto)
- [ ] Админ-панель

## Ссылки на инструкции

| Платформа | Ссылка |
|-----------|--------|
| Android | https://telegra.ph/Podklyuchenie-VPN-na-Android-01-12 |
| iOS (iPhone) | https://telegra.ph/IPhone-03-02-5 |
| Windows | https://telegra.ph/Podklyuchenie-VPN-na-Windows-01-12 |
| macOS | https://telegra.ph/IPhone-03-02-5 |

## Поддержка

- **FAQ**: https://telegra.ph/VPN-01-10-14
- **Написать в поддержку (ВК)**: https://vk.com/im?sel=-XXXXXX
- **Условия сервиса**: https://telegra.ph/Polzovatelskoe-soglashenie-04-01-19
- **Политика конфиденциальности**: https://telegra.ph/Politika-konfidencialnosti-04-01-26
