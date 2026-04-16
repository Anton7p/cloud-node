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

### CI/CD Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ТРИГГЕРЫ (Triggers)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  push: [main, master]  │  pull_request  │  workflow_dispatch (manual)   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR: .github/workflows/main.yml            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐  │
│  │   Stage 1   │ →  │   Stage 2   │ →  │          Stage 3            │  │
│  │    Build    │    │   Deploy    │    │    Infrastructure           │  │
│  │ Docker Image│    │   App Stack │    │    (Nodes Setup)            │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────────┘  │
│       outputs              needs: build         needs: [build, deploy]   │
│    image_tag               to: master                to: nodes         │
│    image_name                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Версионирование Docker Images

| Сервис | Версия | Стратегия |
|--------|--------|-----------|
| **CloudNode Bot** | `ghcr.io/anton7p/cloud-node:<commit-sha>` | Строгий SHA — каждый деплой уникален |
| **PostgreSQL** | `postgres:16-alpine` | Фиксированная мажорная версия (данные) |
| **Redis** | `redis:7-alpine` | Фиксированная мажорная версия |
| **Marzban** | `gozargah/marzban:v0.6.0` | Фиксированная версия — стабильность API |
| **Marzban-Node** | `gozargah/marzban-node:v0.4.2` | Фиксированная версия — совместимость с Core |

### Требуемые Secrets в GitHub

Настройте в **Settings → Secrets and variables → Actions**:

```env
# Обязательные
TELEGRAM_BOT_TOKEN=           # Токен Telegram бота
ENCRYPTION_KEY=               # Ключ шифрования (32 bytes)

# Инфраструктура (SSH root + ключевая аутентификация)
# Формат SERVER_IP: {"address": "1.2.3.4", "password": "temp_password"}
SERVER_IP=
# Формат INFRASTRUCTURE_IP_LIST: [{"address": "1.2.3.5", "password": "temp_password"}]
INFRASTRUCTURE_IP_LIST=
SSH_PRIVATE_KEY=              # SSH приватный ключ (PEM format)
SSH_PUBLIC_KEY=               # SSH публичный ключ (для authorized_keys)

# Marzban VPN
VPN_ADMIN_USERNAME=           # Админ логин Marzban
VPN_ADMIN_PASSWORD=           # Админ пароль Marzban (используется для DB, Redis)
DOMAIN_NAME=                  # Домен для VPN (для TLS сертификатов)

# VLESS + Reality (генерируются автоматически если не указаны)
REALITY_PRIVATE_KEY=          # Приватный ключ X25519
REALITY_PUBLIC_KEY=           # Публичный ключ X25519
REALITY_SHORT_ID=             # Short ID (8 hex символов)
MARZBAN_INBOUND_TAG=          # Тег инбаунда (default: VLESS_REALITY)
```

> **Note:** `GITHUB_TOKEN` выдаётся автоматически для пуша в GHCR.

### Stage 1: Build (`.github/workflows/build.yml`)

**Что делает:**
1. Собирает Docker образ NestJS приложения
2. Генерирует уникальный тег из Git commit SHA (например `a81813f`)
3. Пушит в GitHub Container Registry: `ghcr.io/anton7p/cloud-node:<sha>`

**Выход:**
```yaml
image_name: ghcr.io/anton7p/cloud-node
image_tag: a81813f...  # Git commit SHA
```

### Stage 2: Deploy (`.github/workflows/deploy.yml`)

**Цель:** Master сервер (из SERVER_IP)

**Порядок выполнения Ansible:**
```
deploy_app.yml
├── 01-backup.yml        # Резервное копирование .env
├── 02-configure.yml     # Генерация .env и docker-compose.yml
├── docker-setup.yml     # Установка Docker (если отсутствует)
├── 03-docker-auth.yml   # Логин в GHCR
├── 04-pull-image.yml    # docker pull ghcr.io/...:<sha>
├── 05-stack-deploy.yml  # docker compose up -d
│                         └── docker image prune -f  # Очистка старых SHA
├── 06-health-check.yml  # Проверка контейнеров
└── 07-cleanup.yml       # Ротация логов
```

**Стек на Master:**
- `cloudnode-bot` — Telegram бот (NestJS)
- `cloudnode-db` — PostgreSQL 16
- `cloudnode-redis` — Redis 7
- `cloudnode-marzban` — VPN панель (v0.6.0)

### Stage 3: Infrastructure (`.github/workflows/infrastructure.yml`)

**Цель:** Ноды из INFRASTRUCTURE_IP_LIST

**Порядок выполнения Ansible:**
```
deploy_node.yml
├── directory-setup.yml       # /var/www/marzban_node
├── docker-setup.yml          # Docker CE + Compose V2
├── system-optimization.yml   # SSH hardening, UFW, Fail2Ban
├── auth-certificate.yml      # Получение SSL сертификата от Master
├── marzban-setup.yml         # Регистрация ноды в Core API
└── marzban-node.yml          # Запуск gozargah/marzban-node:v0.4.2
```

### Manual Workflow: Bootstrap (`.github/workflows/bootstrap.yml`)

**Когда использовать:**
- Новый сервер (чистая Ubuntu 24.04)
- Переустановка ОС (новые SSH host keys)
- Потеря SSH доступа

**Флоу:**
```
Input: {"address":"1.2.3.4","password":"root_pass"}
       ↓
1. ssh-keygen -R <IP>          # Очистка старых host keys
2. SSH по паролю (единственный раз!)
3. Установка SSH_PUBLIC_KEY в /root/.ssh/authorized_keys
4. chmod 700 .ssh / 600 authorized_keys  # Ubuntu 24.04 strict mode
5. Disable PasswordAuthentication
6. Enable PubkeyAuthentication
7. Restart SSH service
8. Verify: вход по ключу работает
       ↓
Output: Сервер готов для Deploy/Infrastructure (только ключи)
```

### Поток данных CI/CD

```
Developer push → main ─────┐
                           ↓
                    ┌──────────────┐
                    │  GitHub      │
                    │  Actions     │
                    │  (Runner)    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   GHCR Registry      SSH+Ansible        SSH+Ansible
        │              (Master)            (Nodes)
        ↓                  ↓                  ↓
ghcr.io/anton7p    docker-compose      marzban-node
/cloud-node:sha    bot + db + redis    (VPN nodes)
                   + marzban:v0.6.0    
```

### Деплой командами

```bash
# Полный автоматический деплой
git push origin main

# Ручной запуск Bootstrap (для новых серверов)
# Actions → Bootstrap Servers → Run workflow
# server_ip_json: {"address":"62.60.229.227","password":"root_pass"}

# Ручной запуск Ansible (отладка)
cd ansible
ansible-playbook -i inventory.ini deploy_app.yml \
  -e "image_name=ghcr.io/anton7p/cloud-node" \
  -e "image_tag=<commit-sha>"
```

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
