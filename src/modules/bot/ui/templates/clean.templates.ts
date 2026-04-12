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

// Пути к изображениям
export const IMAGES = {
  // Главный экран (VPN/безопасность)
  START_HUD: 'assets/images/start_hud.svg',

  // Инструкции (подключение/настройка)
  INSTRUCTIONS_HUD: 'assets/images/instructions_hud.svg',

  // Поддержка (помощь/контакт)
  SUPPORT_HUD: 'assets/images/support_hud.svg',

  // Ключ/продление (доступ/ключ)
  KEY_HUD: 'assets/images/key_hud.svg',

  // Партнёрская программа
  PARTNERS_HUD: 'assets/images/partners_hud.svg',

  // Условия и поддержка
  LEGAL_HUD: 'assets/images/legal_hud.svg',
} as const;

// Команды меню для BotFather
export const MENU_COMMANDS = {
  START: { command: 'start', description: 'Главное меню' },
  KEY: { command: 'key', description: 'Быстрый старт' },
  MYKEY: { command: 'mykey', description: 'Мои ключи' },
  SUPPORT: { command: 'support', description: 'Поддержка' },
} as const;

// ============================================================================
// СООБЩЕНИЯ
// ============================================================================

export const MESSAGES = {
  // Главный экран (динамический)
  MAIN_TITLE: (
    firstName: string,
    hasSubscription: boolean,
    expiryDate?: string,
  ) => {
    let statusText: string;
    if (hasSubscription && expiryDate) {
      statusText = `✅ Активный ключ (до: ${expiryDate})`;
    } else {
      statusText = '📋 У вас пока нет активных ключей';
    }

    return (
      `Привет, ${firstName}! 👋\n\n` +
      `Быстрый доступ к интернету без ограничений:\n` +
      `▬ Подключение за минуту\n` +
      `▬ Высокая скорость на всех устройствах\n` +
      `▬ Поддержка 24/7\n\n` +
      `${statusText}`
    );
  },

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

  // Инструкции для конкретной платформы
  INSTRUCTIONS_PLATFORM: (platform: string, appName: string, url: string) =>
    `📱 Инструкция для ${platform}\n\n` +
    `1. Установите: ${appName}\n` +
    `   ${url}\n\n` +
    `2. Нажмите «🚀 Быстрый старт» в боте\n\n` +
    `3. Скопируйте ключ и вставьте в приложение`,

  // Общие инструкции
  INSTRUCTIONS:
    `🧭 Как подключить\n\n` +
    `1. Установите приложение:\n` +
    `   • iOS: Shadowrocket или Streisand\n` +
    `   • Android: V2RayNG или NekoBox\n` +
    `   • Windows: V2RayN или NekoRay\n` +
    `   • macOS: Shadowrocket или V2RayXS\n\n` +
    `2. Нажмите «🚀 Быстрый старт» в боте\n\n` +
    `3. Скопируйте ключ и вставьте в приложение`,

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
} as const;

// ============================================================================
// ДЕЙСТВИЯ (callback data)
// ============================================================================

export const ACTIONS = {
  // Главное меню
  START_MENU: 'start_menu',
  BUY_MENU: 'buy_menu',
  MY_KEYS: 'my_keys',
  INSTRUCTIONS: 'instructions',
  PARTNERS: 'partners',
  LEGAL: 'legal',

  // Legacy поддержка
  GET_KEY: 'buy_menu', // переадресация на новый экран
  EXTEND_KEY: 'extend_key',
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

// Ссылки на инструкции для платформ
export const PLATFORM_LINKS = {
  ANDROID: {
    name: 'Hiddify',
    url: 'https://play.google.com/store/apps/details?id=app.hiddify.com',
    guideUrl: 'https://telegra.ph/Podklyuchenie-VPN-na-Android-01-12',
    emoji: '🤖',
  },
  WINDOWS: {
    name: 'Hiddify',
    url: 'https://github.com/hiddify/hiddify-next/releases',
    guideUrl: 'https://telegra.ph/Podklyuchenie-VPN-na-Windows-01-12',
    emoji: '🖥',
  },
  IOS: {
    name: 'Shadowrocket / Streisand',
    url: 'https://apps.apple.com',
    guideUrl: 'https://telegra.ph/IPhone-03-02-5',
    emoji: '📱',
  },
  MACOS: {
    name: 'Shadowrocket',
    url: 'https://apps.apple.com',
    guideUrl: 'https://telegra.ph/IPhone-03-02-5',
    emoji: '💻',
  },
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
} as const;
