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
│  push: [main]          │  workflow_dispatch (manual)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR: .github/workflows/ci.yml              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │   Stage 1       │  │   Stage 2       │  │   Stage 3               │  │
│  │   Build & Push  │→ │   Verify Secrets│→ │   Deploy Application    │  │
│  │   Docker Image  │  │                 │  │   to Master Server      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│       outputs              needs: build        needs: [build, verify]    │
│    image_tag                                environment: production      │
│    image_name                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │   Stage 4 (Optional)                                               │  │
│  │   Infrastructure — Setup Nodes from INFRASTRUCTURE_IP_LIST           │  │
│  │   needs: deploy                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Версионирование Docker Images

| Сервис | Версия | Стратегия |
|--------|--------|-----------|
| **CloudNode Bot** | `ghcr.io/anton7p/cloud-node:<commit-sha>` | Строгий SHA — каждый деплой уникален |
| **PostgreSQL** | `postgres:16-alpine` | Фиксированная мажорная версия (данные) |
| **Redis** | `redis:7.2-alpine` | Фиксированная минорная версия |
| **Marzban** | `gozargah/marzban:v0.8.4` | Фиксированная версия — стабильность API |
| **Marzban-Node** | `gozargah/marzban-node:v0.5.2` | Фиксированная версия — совместимость с Core v0.8.4 |

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

### Workflow файлы

| Файл | Назначение | Триггер |
|------|------------|---------|
| `.github/workflows/ci.yml` | Полный CI/CD пайплайн | `push: [main]` |
| `.github/workflows/bootstrap.yml` | Первоначальная настройка SSH | `workflow_dispatch` (ручной) |

---

### Stage 1: Build & Push Docker Image (`test-and-build`)

**Файл:** `.github/workflows/ci.yml`

**Что делает:**

| # | Шаг | Действие |
|---|-----|----------|
| 1 | **Checkout** | Клонирование репозитория |
| 2 | **Normalize image name** | Приведение имени образа к lowercase |
| 3 | **Setup Docker Buildx** | Настройка BuildKit |
| 4 | **Login to GHCR** | Авторизация в GitHub Container Registry (`secrets.GITHUB_TOKEN`) |
| 5 | **Extract metadata** | Генерация тегов: `type=sha` (short), `type=ref,event=branch`, `latest` |
| 6 | **Build and push** | Сборка и пуш с layer caching (`cache-from: type=gha`, `cache-to: type=gha,mode=max`) |
| 7 | **Output image info** | Вывод информации об образе в логи |

**Выходные данные (outputs):**
```yaml
image_tag: ${{ steps.meta.outputs.version }}    # Git commit SHA
image_name: ${{ steps.normalize.outputs.image_name_lower }}  # ghcr.io/anton7p/cloud-node
```

### Stage 2: Verify Secrets (`verify-secrets`)

**Зависимость:** `test-and-build`

Проверяет обязательные секреты GitHub перед деплоем:

| Secret | Проверка |
|--------|----------|
| `SERVER_IP` | JSON формат `{"address": "1.2.3.4", "password": "..."}` |
| `SSH_PRIVATE_KEY` | Установлен или нет |
| `DOMAIN_NAME` | Установлен или нет |
| `INFRASTRUCTURE_IP_LIST` | Опционально — проверка JSON массива |

**При ошибке:** пайплайн фейлится до начала деплоя.

---

### Stage 3: Deploy Application (`deploy`)

**Зависимости:** `[test-and-build, verify-secrets]`  
**Environment:** `production`  
**Цель:** Master сервер (из `SERVER_IP`)

**Подготовка:**
| # | Шаг | Действие |
|---|-----|----------|
| 1 | **Setup SSH** | Создание `~/.ssh/id_rsa`, `chmod 600`, отключение `StrictHostKeyChecking` |
| 2 | **Install deps** | `pip install ansible`, `apt-get install jq sshpass` |
| 3 | **Parse SERVER_IP** | Парсинг JSON → генерация `inventory.ini` (парольная или ключевая аутентификация) |
| 4 | **Generate vars** | Создание `deploy_vars.yml` с переменными для Ansible |
| 5 | **Run playbook** | `ansible-playbook -i inventory.ini ansible/deploy_app.yml` |

**Ansible Playbook:** `ansible/deploy_app.yml`

```
deploy_app.yml
├── pre_tasks (валидация)
│   ├── DEBUG — логирование
│   ├── Проверка диска (df -h)
│   ├── Валидация: image_name, image_tag
│   ├── Валидация: db_password, telegram_bot_token, encryption_key
│   └── Валидация: vpn_admin_username, vpn_admin_password, domain_name
│
├── tasks/docker-setup.yml
│   ├── Удаление конфликтных пакетов (containerd, docker.io)
│   ├── Установка Docker через get.docker.com
│   ├── Enable & start Docker service
│   ├── Настройка daemon.json (iptables, ip-forward)
│   └── Настройка iptables цепочки DOCKER-USER
│
├── tasks/system-optimization.yml
│   ├── SSH hardening (отключение password auth)
│   ├── UFW firewall (порты 22, 443, 8000, 62050)
│   ├── TCP BBR congestion control
│   └── Docker firewall protection
│
└── tasks/deploy-stack.yml
    ├── BACKUP: /var/backups/cloudnode/{.env,docker-compose.yml}.{timestamp}
    ├── CONFIGURE: генерация .env из templates/.env.j2
    ├── DOCKER AUTH: docker login ghcr.io
    ├── PULL: docker pull ghcr.io/...:<sha>
    │
    ├── BOOT SEQUENCE:
    │   ├── Шаг 1: docker compose up -d db redis → ожидание PostgreSQL (pg_isready)
    │   ├── Шаг 2: docker compose up -d marzban → ожидание healthcheck
    │   └── Шаг 3: setup-reality-keys.yml (генерация Reality keys через Marzban API)
    │
    ├── HEALTH CHECK:
    │   ├── Проверка всех контейнеров: bot, db, redis, marzban
    │   ├── Сбор логов при ошибках
    │   └── Fail если критический сервис не запущен
    │
    └── CLEANUP: docker image prune -af --filter "until=168h"
```

**Стек на Master:**

| Сервис | Контейнер | Образ | Назначение |
|--------|-----------|-------|------------|
| Bot | `cloudnode-bot` | `ghcr.io/anton7p/cloud-node:<sha>` | NestJS Telegram бот |
| Database | `cloudnode-db` | `postgres:16-alpine` | PostgreSQL данные |
| Queue | `cloudnode-redis` | `redis:7.2-alpine` | BullMQ очереди |
| VPN Core | `cloudnode-marzban` | `gozargah/marzban:v0.8.4` | VPN панель управления |

### Stage 4: Setup Infrastructure Nodes (`infrastructure`)

**Зависимость:** `deploy`  
**Условие:** Выполняется только если `INFRASTRUCTURE_IP_LIST` задан  
**Цель:** Ноды из `INFRASTRUCTURE_IP_LIST`

**Подготовка:**
| # | Шаг | Действие |
|---|-----|----------|
| 1 | **Parse INFRASTRUCTURE_IP_LIST** | Парсинг JSON массива нод |
| 2 | **Generate inventory** | Создание `inventory_nodes.ini` |
| 3 | **Parse master address** | Определение IP мастера для связи |
| 4 | **Run playbook** | `ansible-playbook -i inventory_nodes.ini ansible/deploy_node.yml` |

**Ansible Playbook:** `ansible/deploy_node.yml`
```
deploy_node.yml
├── directory-setup.yml       # /var/www/marzban_node
├── docker-setup.yml          # Docker CE + Compose V2
├── system-optimization.yml   # SSH hardening, UFW, TCP BBR
├── auth-certificate.yml      # Получение SSL сертификата от Master
└── marzban-node.yml          # Запуск gozargah/marzban-node:v0.5.2
```

### Manual Workflow: Bootstrap (`.github/workflows/bootstrap.yml`)

**Когда использовать:**
- Новый сервер (чистая Ubuntu 24.04)
- Переустановка ОС (новые SSH host keys)
- Потеря SSH доступа

**Input параметры:**
| Параметр | Формат | Обязательный |
|----------|--------|--------------|
| `server_ip_json` | `{"address":"1.2.3.4","password":"root_pass"}` | Да |
| `infrastructure_ips_json` | `[{"address":"1.2.3.5","password":"pass"}]` | Нет |

**Пошаговый флоу:**

| # | Шаг | Действие |
|---|-----|----------|
| 1 | **Checkout** | Клонирование репозитория |
| 2 | **Install deps** | `pip install ansible jq`, `apt-get install sshpass` |
| 3 | **Clean old keys** | `ssh-keygen -R <IP>` для мастера и всех нод |
| 4 | **Parse servers** | Парсинг JSON, генерация `inventory_bootstrap.ini` с парольной аутентификацией |
| 5 | **Run Bootstrap** | `ansible-playbook -i inventory_bootstrap.ini bootstrap.yml` |
| 6 | **Verify SSH** | Проверка доступа по ключу (без пароля) |
| 7 | **Cleanup** | Удаление `~/.ssh/id_rsa`, `inventory_bootstrap.ini` |

**Ansible Playbook:** `ansible/bootstrap.yml`
```
bootstrap.yml
├── Wait for connection (timeout: 60s)
├── Validate SSH_PUBLIC_KEY
├── Ensure /root/.ssh (chmod 700)
├── Ensure authorized_keys (chmod 600)
├── Install SSH public key (authorized_key module, exclusive: yes)
├── Backup /etc/ssh/sshd_config
├── Disable PasswordAuthentication
├── Enable PubkeyAuthentication
├── Set PermitRootLogin prohibit-password
├── Validate SSH config (sshd -t)
├── Restart SSH service
└── Verify: вход по ключу работает
```

**Output:** Сервер готов для CI/CD деплоя (только SSH ключи, без паролей).

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
                   + marzban:v0.8.4
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

# Настройка инфраструктурных нод
cd ansible
ansible-playbook -i inventory.ini deploy_node.yml \
  -e "domain_name=your.domain.com" \
  -e "VPN_ADMIN_USERNAME=admin" \
  -e "VPN_ADMIN_PASSWORD=secret"

# Деплой приложения с полным набором переменных
ansible-playbook -i inventory.ini deploy_app.yml \
  -e "image_name=ghcr.io/username/repo" \
  -e "image_tag=latest" \
  -e "telegram_bot_token=xxx" \
  -e "encryption_key=xxx" \
  -e "vpn_admin_username=admin" \
  -e "vpn_admin_password=secret" \
  -e "domain_name=example.com"
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
