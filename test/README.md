# Тестовый набор VPN Telegram Bot

## Структура тестов

### Unit тесты

| Файл | Что тестируется | Ключевые сценарии |
|------|-----------------|-------------------|
| `users/users.repository.spec.ts` | UsersRepository | BigInt конверсия, upsert атомарность, обработка ошибок |
| `rentals/rentals.service.spec.ts` | RentalsService | Кумулятивное продление (3 сценария), транзакционность |
| `integrations/xui-url.service.spec.ts` | XuiUrlService | Генерация ссылок с DOMAIN_NAME, Reality параметры |

### E2E тесты

| Файл | Сценарии |
|------|----------|
| `user-flow.e2e-spec.ts` | Полный жизненный цикл: триал → продление → истечение |

## Команды запуска

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие
npm run test:cov

# Все тесты с ватчем
npm run test:watch
```

## Требования к переменным окружения для тестов

```bash
# Минимальный набор для тестов
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test
cp .env.example .env.test
```

## Основные проверки

### BigInt
- telegramId конвертируется в BigInt при всех операциях с БД
- Нет потери точности для больших ID (> 2^53)

### Кумулятивное продление
1. Новый триал: `now + 3 дня`
2. Продление активного: `current_expires + term`
3. Продление просроченного: `now + term`

### Транзакционность
- `$transaction` используется для всех multi-query операций
- Rollback при ошибках

## CI/CD Pipeline

```bash
npm run lint           # ESLint проверка
npx prisma validate    # Валидация схемы
npm test               # Unit тесты
npm run test:e2e       # E2E тесты
```
