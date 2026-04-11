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
  HELP: { command: 'help', description: 'ИНСТРУКЦИИ' },
  SUPPORT: { command: 'support', description: 'ПОДДЕРЖКА' },
} as const;

// ============================================================================
// СООБЩЕНИЯ
// ============================================================================

export const MESSAGES = {
  // Главный экран
  MAIN_TITLE: 'ВЫБЕРИТЕ ДЕЙСТВИЕ:',

  // Экран выбора срока
  SELECT_DURATION: 'ВЫБЕРИТЕ СРОК ДОСТУПА:',

  // Экран с ключом
  KEY_READY: (duration: string, key: string) =>
    `КЛЮЧ ДОСТУПА (${duration})\n\n` +
    `\`\`\`\n${key}\n\`\`\`\n\n` +
    `СКОПИРУЙТЕ КЛЮЧ И ВСТАВЬТЕ В ПРИЛОЖЕНИЕ`,

  // Инструкции
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
  INSTRUCTIONS: 'instructions',
  SUPPORT: 'support',

  // Выбор срока
  MONTH_1: 'month_1',
  MONTH_3: 'month_3',

  // Навигация
  BACK_TO_MAIN: 'back_to_main',
} as const;

// ============================================================================
// КОНФИГУРАЦИЯ МЕНЮ
// ============================================================================

export const CHAT_MENU_BUTTON = {
  type: 'commands',
  text: 'МЕНЮ',
} as const;
