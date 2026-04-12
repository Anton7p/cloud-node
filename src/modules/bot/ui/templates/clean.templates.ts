// ============================================================================
// CLEAN UI: УПРОЩЕННЫЙ ИНТЕРФЕЙС ДЛЯ ПРОДАЖИ VPN-КЛЮЧЕЙ
// ============================================================================

// Цены на доступ
export const ACCESS_PRICES = [
  {
    months: 0,
    price: 0,
    label: 'Бесплатный тест на 3дн.',
    devices: 2,
    callback: 'free_test',
  },
  { months: 0.25, price: 49, label: 'Неделя', devices: 2, callback: 'week' },
  { months: 1, price: 99, label: 'Месяц', devices: 2, callback: 'month_1' },
  { months: 3, price: 279, label: '3 Месяца', devices: 2, callback: 'month_3' },
  {
    months: 6,
    price: 449,
    label: '6 Месяцев',
    devices: 2,
    callback: 'month_6',
  },
] as const;

// Команды меню для BotFather
export const MENU_COMMANDS = {
  START: { command: 'start', description: 'Главное меню' },
  SUPPORT: { command: 'support', description: 'Поддержка' },
} as const;

// ============================================================================
// СООБЩЕНИЯ
// ============================================================================

export const MESSAGES = {
  // Первый экран (при входе, до нажатия кнопки Старт)
  WELCOME_FIRST:
    '❤️ Лучший сервис по лучшей стоимости\n\n' +
    '🔹 Высокая скорость\n' +
    '🔹 Без ограничений по трафику\n' +
    '🔹 Низкие цены\n' +
    '🔹 Настройка в несколько кликов\n' +
    '🔹 Вознаграждение за приглашение друзей\n\n' +
    'Жми /start и получи 🎁 3 дня бесплатно 👇👇',

  // Главный экран (после нажатия кнопки)
  MAIN_TITLE:
    '⚡️ Добро пожаловать в самый быстрый и стабильный VPN!\n\n' +
    '➖ Нам более года\n' +
    '➖ Высокая скорость\n' +
    '➖ Приватность\n' +
    '➖ Реферальная система 50%\n' +
    '➖ Быстрая поддержка\n' +
    '➖ Поддержка ПК, Телефонов, Телевизоров!\n\n' +
    'VPN прямо в Telegram!\n\n' +
    '🎁 3 Дня бесплатной подписки ⬇️',

  // Экран выбора срока
  SELECT_DURATION: 'Выберите срок подписки:',

  // Экран с ключом (новая покупка)
  KEY_READY: (duration: string, key: string) =>
    `🔑 Ключ доступа (${duration})\n\n` + `\`\`\`\n${key}\n\`\`\``,

  // Экран успеха продления
  EXTEND_SUCCESS: (newEndDate: string) =>
    `✅ Подписка продлена\n\n` +
    `Доступ активен до: ${newEndDate}\n\n` +
    `Ваш текущий ключ продолжает работать.`,

  // Заголовок для экрана продления
  EXTEND_DURATION_TITLE: 'Продлите подписку:',

  // Показать текущий ключ
  MY_KEY_TITLE: '🧾 Ваш текущий ключ:',
  NO_KEY:
    '🧾 Мои ключи\n\nПока пусто. Перейдите в «🚀 Быстрый старт», чтобы получить доступ.',

  // Инструкции (выбор платформы)
  INSTRUCTIONS_TITLE: '🧭 Выберите платформу для настройки:',

  // Заголовок экрана платформы
  PLATFORM_TITLE: (platform: string) => `📱 ${platform}`,

  // Поддержка / Условия
  SUPPORT:
    '⚖️ Условия и поддержка\n\nНаши ресурсы:\n▬ FAQ и ответы на вопросы\n▬ Условия сервиса\n▬ Политика конфиденциальности',

  // Партнёрская программа
  PARTNERS_TITLE: (referralLink: string, referralCount: number) =>
    `🤝 Партнёрская программа\n\n` +
    `Приглашайте друзей и получайте бонусы!\n\n` +
    `Ваша реферальная ссылка:\n${referralLink}\n\n` +
    `└ Приглашено: ${referralCount} чел.`,

  // Экран с моими ключами (когда есть ключ)
  MY_KEYS_ACTIVE: (expiryDate: string, key: string) =>
    `🧾 Мои ключи\n\n` +
    `✅ Активная подписка до: ${expiryDate}\n\n` +
    `\`\`\`\n${key}\n\`\`\``,

  // Ошибки
  UNKNOWN_COMMAND: 'Неизвестная команда',
  ERROR: 'Ошибка. Попробуйте позже.',
  COPY_KEY_ERROR: '❌ Ошибка: ключ не найден',

  // Копирование ключа
  COPY_KEY_READY: (key: string) =>
    `📋 Ваш ключ:\n\n\`\`\`\n${key}\n\`\`\`\n\n✅ Нажмите на ключ выше, чтобы скопировать его`,
} as const;

// ============================================================================
// ДЕЙСТВИЯ (callback data)
// ============================================================================

export const ACTIONS = {
  // Главное меню
  START_MENU: 'start_menu',
  SHOW_MAIN_MENU: 'show_main_menu',
  BUY_MENU: 'buy_menu',
  MY_KEYS: 'my_keys',
  INSTRUCTIONS: 'instructions',
  PARTNERS: 'partners',
  LEGAL: 'legal',

  // Альтернативные названия для совместимости
  MY_KEY: 'my_keys',
  SUPPORT: 'legal',

  // Платформы для инструкций
  PLATFORM_IOS: 'platform_ios',
  PLATFORM_ANDROID: 'platform_android',
  PLATFORM_WINDOWS: 'platform_windows',
  PLATFORM_MACOS: 'platform_macos',

  // Выбор срока
  FREE_TEST: 'free_test',
  WEEK: 'week',
  MONTH_1: 'month_1',
  MONTH_3: 'month_3',
  MONTH_6: 'month_6',

  // Навигация
  BACK_TO_MAIN: 'start_menu',

  // Копирование ключа
  COPY_KEY: 'copy_key',
} as const;

// ============================================================================
// КОНФИГУРАЦИЯ МЕНЮ
// ============================================================================

export const CHAT_MENU_BUTTON = {
  type: 'commands',
  text: '[ МЕНЮ ]',
} as const;

// Ссылки для раздела Условия и поддержка
export const LEGAL_LINKS = {
  FAQ: {
    name: '🧠 FAQ и ответы',
    url: 'https://telegra.ph/VPN-01-10-14',
  },
  TERMS: {
    name: '📄 Условия сервиса',
    url: 'https://telegra.ph/Polzovatelskoe-soglashenie-04-01-19',
  },
  PRIVACY: {
    name: '📄 Политика конфиденциальности',
    url: 'https://telegra.ph/Politika-konfidencialnosti-04-01-26',
  },
  VK: {
    name: '📨 Написать в поддержку',
    url: 'https://vk.com/im?sel=-XXXXXX',
  },
} as const;

// Ссылки на инструкции для платформ
export const PLATFORM_GUIDES = {
  IOS: 'https://telegra.ph/IPhone-03-02-5',
  ANDROID: 'https://telegra.ph/Podklyuchenie-VPN-na-Android-01-12',
  WINDOWS: 'https://telegra.ph/Podklyuchenie-VPN-na-Windows-01-12',
  MACOS: 'https://telegra.ph/IPhone-03-02-5',
} as const;

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  DEFAULT:
    '⚠️ *Произошла небольшая ошибка*\n\nМы уже работаем над её устранением. Попробуйте позже или обратитесь в поддержку.',
  DATABASE:
    '⚠️ *Проблема с базой данных*\n\nНе удалось сохранить данные. Пожалуйста, попробуйте через минуту.',
  NETWORK:
    '⚠️ *Проблема со связью*\n\nНе удалось связаться с сервером. Попробуйте позже.',
  VALIDATION: '⚠️ *Некорректные данные*\n\nПроверьте ввод и попробуйте снова.',
} as const;
