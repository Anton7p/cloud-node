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
VPN_PANEL_URL=                # Базовый URL API панели (опционально: в Docker дефолт http://marzban:8000)

# VLESS + Reality (генерируются автоматически если не указаны)
REALITY_PRIVATE_KEY=          # Приватный ключ X25519
REALITY_PUBLIC_KEY=           # Публичный ключ X25519
REALITY_SHORT_ID=             # Short ID (8 hex символов)
MARZBAN_INBOUND_TAG=          # Тег инбаунда (default: VLESS TCP REALITY)
```

> **Note:** `GITHUB_TOKEN` выдаётся автоматически для пуша в GHCR.

### Workflow файлы

| Файл | Назначение | Триггер |
|------|------------|---------|
| `.github/workflows/ci.yml` | Полный CI/CD пайплайн | `push: [main]` |
| `.github/workflows/bootstrap.yml` | Первоначальная настройка SSH | `workflow_dispatch` (ручной) |

---

### Stage 1: Build & Push Docker Image (`build-and-push`)

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

**Зависимость:** `build-and-push`

Проверяет обязательные секреты GitHub перед деплоем:

| Secret | Проверка |
|--------|----------|
| `SERVER_IP` | JSON формат `{"address": "1.2.3.4", "password": "..."}` |
| `SSH_PRIVATE_KEY` | Установлен или нет |
| `DOMAIN_NAME` | Установлен или нет |
| `INFRASTRUCTURE_IP_LIST` | Опционально; если задан — строго непустой JSON-массив с полем `address` |

**При ошибке:** пайплайн фейлится до начала деплоя.

---

### Stage 3: Deploy Application (`deploy`)

**Зависимости:** `[build-and-push, verify-secrets, ansible-validate]`  
**Environment:** `production`  
**Цель:** Master сервер (из `SERVER_IP`)

**Подготовка:**
| # | Шаг | Действие |
|---|-----|----------|
| 1 | **Setup SSH** | Создание `~/.ssh/id_rsa`, `chmod 600`, отключение `StrictHostKeyChecking` |
| 2 | **Install deps** | `pip install ansible`, `apt-get install jq sshpass` |
| 3 | **Check Bootstrap Status** | Test SSH key access to detect if server needs bootstrap |
| 4 | **Auto Bootstrap (if needed)** | Run `bootstrap-phase.yml` with password auth, install SSH keys |
| 5 | **Generate inventory** | Create `inventory.ini` with SSH key authentication |
| 6 | **Generate vars** | `scripts/ci/write-deploy-vars.sh` → `deploy_vars.yml` |
| 7 | **Run playbook** | `ansible-playbook -i inventory.ini ansible/deploy-phase.yml` |

**Automatic Bootstrap Detection:**
- First-time servers: Pipeline detects SSH key failure, automatically runs bootstrap with password from `SERVER_IP`
- Existing servers: Uses SSH key authentication directly
- Bootstrap installs SSH keys, disables password auth, creates `/var/lib/cloudnode/.bootstrapped` flag |

**Ansible Playbook:** `ansible/deploy-phase.yml`
```
deploy-phase.yml
├── Master Deployment (hosts: master)
│   ├── vars: deploy_dir из `deploy_dir_master`, образ панели из `marzban_panel_image` и т. д.
│   ├── tasks/directory-setup-main.yml
│   │   ├── Создание /var/www/cloudnode
│   │   ├── Настройка прав доступа
│   │   └── Подготовка структуры директорий
│   └── tasks/deploy-stack-main.yml
│       ├── BACKUP: /var/backups/cloudnode/{.env,docker-compose.yml}.{timestamp}
│       ├── CONFIGURE: генерация .env из templates/.env.j2
│       ├── DOCKER AUTH: docker login ghcr.io
│       ├── PULL: docker pull ghcr.io/...:<sha>
│       ├── BOOT SEQUENCE: db redis → marzban → bot
│       ├── REALITY KEYS: генерация через Marzban API
│       ├── HEALTH CHECK: проверка всех контейнеров
│       └── CLEANUP: docker image prune
│
└── Node Deployment (hosts: nodes)
    ├── pre_tasks (валидация CI/CD переменных)
    ├── tasks/directory-setup-main.yml
    │   ├── Создание /var/www/marzban_node
    │   └── Подготовка SSL директорий
    └── tasks/marzban-main.yml
        ├── Получение SSL сертификата от Master
        ├── Настройка marzban-node конфигурации
        ├── Запуск gozargah/marzban-node:v0.5.2
        └── Health check ноды
```

**Стек на Master:**

| Сервис | Контейнер | Образ | Назначение |
|--------|-----------|-------|------------|
| Bot | `cloudnode-bot` | `ghcr.io/anton7p/cloud-node:<sha>` | NestJS Telegram бот |
| Database | `cloudnode-db` | `postgres:16-alpine` | PostgreSQL данные |
| Queue | `cloudnode-redis` | `redis:7.2-alpine` | BullMQ очереди |
| VPN Core | `cloudnode-marzban` | `gozargah/marzban:v0.8.4` | VPN панель управления |

### Stage 4: Setup Infrastructure Nodes (`infrastructure`)

**Зависимости:** `deploy`, `build-and-push`  
**Условие:** job всегда идёт после деплоя; bootstrap нод пропускается, если секрет пустой/`[]`. Инвентарь `inventory_nodes.ini` только с группой `[nodes]` — play `master` в `deploy-phase.yml` пропускается (0 хостов).  
**Цель:** Ноды из `INFRASTRUCTURE_IP_LIST` (если заданы).

**Подготовка:**
| # | Шаг | Действие |
|---|-----|----------|
| 1 | **Parse INFRASTRUCTURE_IP_LIST** | Парсинг JSON массива нод |
| 2 | **Generate inventory** | Создание `inventory_nodes.ini` |
| 3 | **Parse master address** | Определение IP мастера для связи |
| 4 | **Run playbook** | `ansible-playbook -i inventory_nodes.ini ansible/deploy-phase.yml` |

**Ansible Playbook:** `ansible/deploy-phase.yml` (section `hosts: nodes`)
```
Node Deployment в deploy-phase.yml:
├── pre_tasks
│   ├── Валидация CI/CD переменных
│   ├── Определение master_server_address
│   └── Вычисление Marzban API URL
├── tasks/directory-setup-main.yml
│   ├── Создание /var/www/marzban_node
│   └── Подготовка SSL директорий
└── tasks/marzban-main.yml
    ├── Получение SSL сертификата от Master
    ├── Настройка конфигурации ноды
    ├── Запуск marzban-node контейнера
    └── Health check и валидация
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
| 5 | **Run Bootstrap** | `ansible-playbook -i inventory_bootstrap.ini ansible/bootstrap-phase.yml` (из корня репозитория) |
| 6 | **Verify SSH** | Проверка доступа по ключу (без пароля) |
| 7 | **Cleanup** | Удаление `~/.ssh/id_rsa`, `inventory_bootstrap.ini` |

**Ansible Playbook:** `ansible/bootstrap-phase.yml`  
Перечисления по умолчанию — в `ansible/group_vars/all.yml`; секретный набор — по примеру `ansible/deploy_vars.example.yml`. Синтаксис плейбуков (CI job `ansible-validate`):  
`ansible-playbook --syntax-check -i ansible/ci_inventory.ini ansible/deploy-phase.yml` и др.
```
bootstrap-phase.yml
├── Bootstrap Phase (hosts: all)
│   ├── pre_tasks
│   │   ├── Проверка `ssh_public_key` (-e / `SSH_PUBLIC_KEY`)
│   │   ├── Парсинг infrastructure_ip_list (JSON / CSV / fallback)
│   ├── tasks/bootstrap-main.yml
│   │   ├── tasks/bootstrap/bootstrap-master.yml (для master)
│   │   ├── tasks/bootstrap/bootstrap-node.yml (для nodes)
│   │   └── tasks/bootstrap/common/ (общие задачи)
│   │       ├── ssh-setup.yml — установка SSH ключей
│   │       ├── ssh-hardening.yml — отключение password auth
│   │       ├── docker-setup.yml — установка Docker
│   │       ├── ufw-setup.yml — настройка firewall
│   │       └── tcp-bbr.yml — TCP BBR congestion control
│   └── Создание флага /var/lib/cloudnode/.bootstrapped
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
ansible-playbook -i inventory.ini deploy-phase.yml \
  -e "image_name=ghcr.io/anton7p/cloud-node" \
  -e "image_tag=<commit-sha>"

# Настройка инфраструктурных нод (теперь часть deploy-phase.yml)
cd ansible
ansible-playbook -i inventory_nodes.ini deploy-phase.yml \
  -e "domain_name=your.domain.com" \
  -e "VPN_ADMIN_USERNAME=admin" \
  -e "VPN_ADMIN_PASSWORD=secret" \
  -e "master_server_address=<master_ip>"

# Деплой приложения с полным набором переменных
ansible-playbook -i inventory.ini deploy-phase.yml \
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
- **🔑 Мои ключи** — Текущий ключ и срок подписки
- **🧭 Как подключить** — Инструкции для iOS/Android/Windows/macOS
- **⚖️ Условия** — FAQ и документы сервиса (Telegra.ph)

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
- **Условия сервиса**: https://telegra.ph/Polzovatelskoe-soglashenie-04-01-19
- **Политика конфиденциальности**: https://telegra.ph/Politika-konfidencialnosti-04-01-26
