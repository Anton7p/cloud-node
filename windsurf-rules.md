# CloudNode VPN - Архитектурный Контекст

## Критичные Технические Детали

### 1. Prisma Migrations (Критично!)
- **Проблема:** `prisma/migrations` папка не сохраняется в volume
- **Решение:** Миграции должны быть закоммичены в репозиторий
- **Команды:**
  - Генерация: `npx prisma migrate dev --name init --create-only`
  - Baseline: `npx prisma migrate resolve --applied 20240101000000_init`
  - Deploy: `npx prisma migrate deploy`
- **НЕ ИСПОЛЬЗОВАТЬ:** `prisma db push --accept-data-loss` в production!

### 2. Marzban Node Health Check
- **Протокол:** HTTP (не HTTPS!)
- **Порт:** 62050
- **URL:** `http://localhost:62050/health`
- **Контейнер:** `gozargah/marzban-node:v0.5.2`
- **Окружение:** `SSL_CLIENT_CERT_FILE=/var/lib/marzban-node/ssl_client_cert.pem`

### 3. VLESS Reality Inbound
- **API Endpoint:** `/api/core/config` (PUT)
- **Не `/api/inbounds`** - этот endpoint возвращает 405
- **Формат запроса:**
  ```json
  {
    "inbounds": [{
      "tag": "VLESS Reality TCP",
      "protocol": "vless",
      "port": 443,
      "streamSettings": {
        "security": "reality",
        "realitySettings": {
          "privateKey": "...",
          "publicKey": "...",
          "dest": "DOMAIN:443"
        }
      }
    }]
  }
  ```

### 4. Регистрация Ноды
- **Endpoint:** POST `/api/node`
- **Формат полей:**
  - `name`: строка с заменой точек на дефисы (`213-108-23-243`)
  - `address`: строка IP (`213.108.23.243`) - **не массив!**
  - `port`: 62050
  - `api_prefix`: SHA1 хэш от IP (первые 8 символов)
  - `certificate`: содержимое ssl_client_cert.pem
- **Cleanup:** Не нужен на чистом сервере

### 5. DOMAIN_NAME
- **Источник:** GitHub Secrets `DOMAIN_NAME`
- **Использование:**
  - Marzban Reality dest: `{DOMAIN}:443`
  - VLESS ссылки: `vless://{uuid}@{DOMAIN}:443`
  - Прописывается в `docker-compose.yml` как env var

## CI/CD Pipeline (Рефакторинг завершен)

### Workflows (Упрощено: 2 файла вместо 5)
1. **ci.yml** - единый pipeline: test → build → verify → deploy → infrastructure
2. **bootstrap.yml** - первичная настройка SSH ключей (ручной запуск)

### Удалены:
- ❌ main.yml (оркестратор)
- ❌ build.yml (встроен в ci.yml)
- ❌ deploy.yml (встроен в ci.yml)
- ❌ infrastructure.yml (встроен в ci.yml)
- ❌ debug job (проверка секретов внутри deploy job)

### Ansible Playbooks
- `deploy_app.yml` - мастер сервер (docker compose up + healthcheck)
- `deploy_node.yml` - ноды (marzban-node)
- `bootstrap.yml` - первичная настройка SSH ключей

### Упрощения:
- ❌ Убраны все `docker compose exec` команды из Ansible
- ❌ Убрана manual миграция Prisma (теперь в entrypoint контейнера)
- ❌ Убран debug job (лишний runner)
- ✅ Теперь только `docker compose up` и ожидание healthcheck

### Последовательность Деплоя
```
Bootstrap (ручной) → CI/CD Pipeline (автоматом на push):
  test-and-build → verify-secrets → deploy (master) → infrastructure (nodes)
```

### Pipeline Features:
- **Test stage**: lint + unit tests перед build
- **Verify secrets**: быстрая проверка перед деплоем
- **Health-based deploy**: ждем healthy статус, не запускаем миграции вручную

## Порты и Firewall

### Master (62.60.229.227)
- 8000 - Marzban API (только от нод)
- 443 - VLESS Reality (все)
- 3000 - Bot health (localhost только)
- 22 - SSH

### Node (213.108.23.243)
- 62050 - Marzban Node API (только от мастера)
- 62051 - Xray API (localhost)
- 443 - VLESS Reality (все)
- 22 - SSH

## Критичные Проблемы (История)

1. **P3005 Prisma Error** - БД не пустая, но нет миграций
   - Решение: baseline или закоммиченные миграции

2. **SSL_CLIENT_CERT_FILE** - Нода не поднимается без сертификата
   - Решение: Передача сертификата через API мастера

3. **VLESS Reality 405** - Неверный endpoint
   - Решение: Использовать `/api/core/config`

4. **Node address array** - API ожидает строку, не массив
   - Решение: `address: "213.108.23.243"` (не `[{"address": "..."}]`)

## Безопасность

- **ignore_errors: yes** - Убрано везде! Ansible теперь падает на ошибках
- **Fail2Ban** - Должен быть установлен (если нет - проверить workflow)
- **UFW** - Настроен через Ansible
- **SSH** - Только ключи (пароли отключены после bootstrap)

## Команды Диагностики

```bash
# На мастере
docker logs cloudnode-marzban -f
docker logs cloudnode-bot --tail 50
curl http://localhost:8000/api/nodes

# На ноде
docker logs marzban-node -f
curl http://localhost:62050/health

# Prisma baseline
docker exec cloudnode-bot npx prisma migrate resolve --applied 20240101000000_init
```

## Архитектурные Решения

1. **HTTP vs HTTPS** - Нода использует HTTP для REST API (внутри Docker network)
2. **Prisma db push vs migrate** - В production только migrate deploy
3. **Node cleanup** - Не нужен на чистом сервере
4. **DOMAIN_NAME** - Единый источник правды для Reality и ссылок
