# CloudNode VPN Bot

⚡️ Быстрый и стабильный VPN прямо в Telegram. Поддержка ПК, телефонов, телевизоров.

## Production Ready

- **GitOps деплой** через GitHub Actions
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

### CI/CD Pipeline

Проект использует **GitHub Actions** для автоматического деплоя:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Build    │ → │Infrastructure│ → │   Deploy    │
│ Docker Image│    │  Ansible    │    │  Ansible    │
└─────────────┘    └─────────────┘    └─────────────┘
      ↓                   ↓                  ↓
  GHCR Registry      Node Setup          App Stack
```

### Требуемые Secrets в GitHub

Настройте в **Settings → Secrets and variables → Actions**:

```env
# Обязательные
TELEGRAM_BOT_TOKEN=           # Токен Telegram бота
ENCRYPTION_KEY=               # Ключ шифрования

# Инфраструктура (SSH root + ключевая аутентификация)
# Формат SERVER_IP: {"address": "1.2.3.4", "password": "temp_password"}
SERVER_IP=
# Формат INFRASTRUCTURE_IP_LIST: [{"address": "1.2.3.5", "password": "temp_password"}]
INFRASTRUCTURE_IP_LIST=
SSH_PRIVATE_KEY=              # SSH приватный ключ
SSH_PUBLIC_KEY=               # SSH публичный ключ

# Marzban VPN
VPN_ADMIN_USERNAME=           # Админ логин Marzban
VPN_ADMIN_PASSWORD=           # Админ пароль Marzban
DOMAIN_NAME=                  # Домен для VPN

# VLESS + Reality
REALITY_PRIVATE_KEY=          # Приватный ключ (генерируется автоматически)
REALITY_PUBLIC_KEY=           # Публичный ключ (генерируется автоматически)
REALITY_SHORT_ID=             # Short ID (генерируется автоматически, 8 hex)
MARZBAN_INBOUND_TAG=          # Тег инбаунда (default: VLESS_REALITY)
```

> **Note:** `GITHUB_TOKEN` выдаётся автоматически для пуша в GHCR.

### Первичная настройка серверов (Bootstrap)

Для новых серверов сначала выполните bootstrap для установки SSH ключей:

```bash
# Запустите workflow вручную через GitHub Actions
# Actions → Bootstrap Servers → Run workflow
#
# Параметры:
# server_ip_json: {"address":"1.2.3.4","password":"root_password"}
# infrastructure_ips_json: [{"address":"1.2.3.5","password":"root_password"}]
```

### Деплой

```bash
# Push в main запускает полный CI/CD pipeline
git push origin main

# Pipeline включает:
# 1. Сборка Docker образа с кэшированием (gha)
# 2. Пуш в GitHub Container Registry (ghcr.io)
# 3. Настройка инфраструктурных нод (Ansible)
# 4. Деплой приложения на master ноду (Ansible)
```

### Архитектура деплоя

| Компонент | Описание |
|-----------|----------|
| `.github/workflows/main.yml` | GitHub Actions workflow |
| `ansible/deploy_node.yml` | Настройка Marzban нод |
| `ansible/deploy_app.yml` | Деплой приложения и Docker Compose |
| `ansible/templates/.env.j2` | Шаблон конфигурации |
| `ghcr.io` | Docker Registry |

### Ручной запуск Ansible (для отладки)

```bash
# Настройка инфраструктурных нод
cd ansible
ansible-playbook -i inventory.ini deploy_node.yml \
  -e "domain_name=your.domain.com" \
  -e "VPN_ADMIN_USERNAME=admin" \
  -e "VPN_ADMIN_PASSWORD=secret"

# Деплой приложения (db_password берется из VPN_ADMIN_PASSWORD)
ansible-playbook -i inventory.ini deploy_app.yml \
  -e "image_name=ghcr.io/username/repo" \
  -e "image_tag=latest" \
  -e "telegram_bot_token=xxx"
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
