# Настройка системной кнопки "Старт" в @BotFather

## Шаг 1: Настройка Bot Menu Button (системная синяя кнопка)

### Через @BotFather:

1. Открой @BotFather в Telegram
2. Отправь команду: `/mybots`
3. Выбери своего бота
4. Нажми **Menu Button** → **Configure menu button**
5. Выбери тип: **Commands**
6. Текст кнопки: `🚀 СТАРТ`
7. Описание: `Запустить CLOUDNODE SYSTEM`

### Альтернативно через Bot API (curl):

```bash
curl -X POST \
  https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setChatMenuButton \
  -H 'Content-Type: application/json' \
  -d '{
    "menu_button": {
      "type": "commands",
      "text": "🚀 СТАРТ"
    }
  }'
```

## Шаг 2: Настройка списка команд (/setcommands)

В @BotFather выполни `/setcommands` и вставь:

```
start - 🚀 Запустить CLOUDNODE SYSTEM
help - ❓ Помощь и поддержка
```

## Шаг 3: Настройка описания бота (/setdescription)

```
🌐 CLOUDNODE SECURE SYSTEM v2.0

⚡ Высокопроизводительные VPS-серверы
🔒 Датацентры в Финляндии
📡 Гарантия доступности 99.9%

Нажмите 🚀 СТАРТ для входа в систему
```

## Шаг 4: Настройка короткого описания (/setabouttext)

```
🚀 Запустите CLOUDNODE SYSTEM для доступа к защищенным VPS-серверам
```

## Шаг 5: Установка аватара (/setuserpic)

Загрузите HUD-иконку из `assets/hud/` как аватар бота.

---

## Результат

После настройки у пользователя будет:
- **Синяя кнопка "🚀 СТАРТ"** внизу экрана (системная)
- При нажатии: Cyberpunk-терминал с HUD-баннером и inline-кнопками
- Нет reply-keyboard (чистый интерфейс)
