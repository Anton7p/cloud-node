
⚡️ Быстрый и стабильный VPN прямо в Telegram. Поддержка ПК, телефонов, телевизоров. Реферальная система 50%.

## Архитектура (Clean Architecture)

```
src/
├── app.module.ts              # Корневой модуль
├── main.ts                    # Точка входа
├── shared/                    # Общие сервисы
│   ├── prisma/                # Prisma ORM
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── config/                # Конфигурация
│   │   └── configuration.ts
│   └── health/                # Health check
│       └── health.controller.ts
├── modules/                   # Domain модули
│   ├── users/                 # Модуль пользователей
│   │   ├── repositories/
│   │   │   └── users.repository.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── rentals/               # Модуль аренды
│   │   ├── repositories/
│   │   │   └── rentals.repository.ts
│   │   ├── rentals.module.ts
│   │   └── rentals.service.ts
│   └── bot/                   # Telegram Bot модуль
│       ├── application/
│       │   ├── base.action.ts
│       │   └── commands/
│       │       ├── start.command.ts
│       │       ├── menu.commands.ts
│       │       ├── instructions.command.ts
│       │       ├── key-management.commands.ts
│       │       └── rental.commands.ts
│       ├── filters/
│       │   └── bot-exception.filter.ts
│       ├── types/
│       │   └── bot.types.ts
│       ├── ui/                # UI Layer
│       │   ├── templates/
│       │   │   └── clean.templates.ts
│       │   └── keyboards/
│       │       └── clean.keyboards.ts
│       ├── bot.update.ts
│       ├── bot-actions.service.ts
│       └── bot.module.ts
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

- **NestJS** — фреймворк для Node.js
- **nestjs-telegraf** — интеграция с Telegram Bot API
- **Prisma ORM** — работа с PostgreSQL
- **@nestjs/config** — управление конфигурацией
- **@nestjs/terminus** — health checks
- **Joi** — валидация переменных окружения

## Установка

```bash
npm install
```

## Настройка

1. Создайте файл `.env`:
```bash
cp .env.example .env
```

2. Заполните `.env`:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/cloudnode?schema=public"
```

3. Инициализируйте БД:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Запуск

```bash
# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## Health Check

```
GET http://localhost:3000/health
```

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
- [ ] BullMQ для очередей задач
- [ ] Платежная интеграция (Stripe/Crypto)
- [ ] VPN-конфигурации WireGuard/Xray
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
