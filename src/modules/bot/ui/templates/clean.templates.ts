// ============================================================================
// CLEAN UI: УПРОЩЕННЫЙ ИНТЕРФЕЙС ДЛЯ ПРОДАЖИ VPN-КЛЮЧЕЙ
// ============================================================================

// Цены на доступ
export const ACCESS_PRICES = [
  { months: 1, price: 199, label: '1 МЕСЯЦ' },
  { months: 3, price: 549, label: '3 МЕСЯЦА' },
] as const;

// Пути к изображениям
export const IMAGES = {
  START_HUD: 'assets/images/start_hud.jpg.jpg',
} as const;

// Команды меню для BotFather
export const MENU_COMMANDS = {
  START: { command: 'start', description: 'ГЛАВНОЕ МЕНЮ' },
  KEY: { command: 'key', description: 'ПОЛУЧИТЬ КЛЮЧ' },
  SUPPORT: { command: 'support', description: 'ПОДДЕРЖКА' },
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
      statusText = `✅ АКТИВНЫЙ КЛЮЧ (ДО: ${expiryDate})`;
    } else {
      statusText = '📋 У ВАС ПОКА НЕТ АКТИВНЫХ КЛЮЧЕЙ';
    }

    return (
      `Привет, ${firstName}! Выберите тариф и подключитесь за минуту.\n\n` +
      `📱 Один ключ работает на 2-х устройствах.\n\n` +
      `${statusText}`
    );
  },

  // Экран выбора срока
  SELECT_DURATION: 'ВЫБЕРИТЕ СРОК ДОСТУПА:',

  // Экран с ключом
  KEY_READY: (duration: string, key: string, nodes?: string) =>
    `КЛЮЧ ДОСТУПА (${duration})\n\n` +
    `\`\`\`\n${key}\n\`\`\`\n\n` +
    `${nodes ? nodes + '\n\n' : ''}` +
    `СКОПИРУЙТЕ КЛЮЧ И ВСТАВЬТЕ В ПРИЛОЖЕНИЕ`,

  // Информация о доступных нодах
  NODES_INFO: 'Доступ активен. Вам доступны узлы: Финляндия, Германия, Турция.',

  // Инструкции (выбор платформы)
  INSTRUCTIONS_TITLE: 'ВЫБЕРИТЕ ПЛАТФОРМУ:',

  // Инструкции для конкретной платформы
  INSTRUCTIONS_PLATFORM: (platform: string, appName: string, url: string) =>
    `ИНСТРУКЦИЯ ДЛЯ ${platform}\n\n` +
    `1. УСТАНОВИТЕ: ${appName}\n` +
    `   ${url}\n\n` +
    `2. НАЖМИТЕ ПОЛУЧИТЬ КЛЮЧ В БОТЕ\n\n` +
    `3. СКОПИРУЙТЕ КЛЮЧ И ВСТАВЬТЕ В ПРИЛОЖЕНИЕ`,

  // Общие инструкции
  INSTRUCTIONS:
    `ИНСТРУКЦИЯ ПО НАСТРОЙКЕ\n\n` +
    `1. УСТАНОВИТЕ ПРИЛОЖЕНИЕ:\n` +
    `   • IOS: SHADOWROCKET ИЛИ STREISAND\n` +
    `   • ANDROID: V2RAYNG ИЛИ NEKOBOX\n` +
    `   • WINDOWS: V2RAYN ИЛИ NEKORAY\n` +
    `   • MACOS: SHADOWROCKET ИЛИ V2RAYXS\n\n` +
    `2. НАЖМИТЕ ПОЛУЧИТЬ КЛЮЧ В БОТЕ\n\n` +
    `3. СКОПИРУЙТЕ КЛЮЧ И ВСТАВЬТЕ В ПРИЛОЖЕНИЕ`,

  // Поддержка
  SUPPORT: 'ОПЕРАТОР: @support_handle',

  // Ошибки
  UNKNOWN_COMMAND: 'НЕИЗВЕСТНАЯ КОМАНДА',
  ERROR: 'ОШИБКА. ПОПРОБУЙТЕ ПОЗЖЕ.',
} as const;

// ============================================================================
// ДЕЙСТВИЯ (callback data)
// ============================================================================

export const ACTIONS = {
  // Главное меню
  GET_KEY: 'get_key',
  EXTEND_KEY: 'extend_key',
  INSTRUCTIONS: 'instructions',
  SUPPORT: 'support',

  // Платформы для инструкций
  PLATFORM_IOS: 'platform_ios',
  PLATFORM_ANDROID: 'platform_android',
  PLATFORM_WINDOWS: 'platform_windows',
  PLATFORM_MACOS: 'platform_macos',

  // Выбор срока
  MONTH_1: 'month_1',
  MONTH_3: 'month_3',

  // Навигация
  BACK_TO_MAIN: 'back_to_main',

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

// Ссылки на приложения для платформ (Telegram заглушки пока нет ключа)
export const PLATFORM_LINKS = {
  IOS: {
    name: 'SHADOWROCKET / STREISAND',
    url: 'https://apps.apple.com',
    telegramUrl: 'https://t.me/cloudnode_apps', // Заглушка: канал с инструкциями
  },
  ANDROID: {
    name: 'V2RAYNG / NEKOBOX',
    url: 'https://play.google.com',
    telegramUrl: 'https://t.me/cloudnode_apps',
  },
  WINDOWS: {
    name: 'V2RAYN / NEKORAY',
    url: 'https://github.com/v2rayn',
    telegramUrl: 'https://t.me/cloudnode_apps',
  },
  MACOS: {
    name: 'V2RAYXS / SHADOWROCKET',
    url: 'https://apps.apple.com',
    telegramUrl: 'https://t.me/cloudnode_apps',
  },
} as const;
