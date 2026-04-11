// ============================================================================
// CYBERPUNK CORPORATE INTERFACE 2.0
// Терминальный стиль с системными префиксами и неоновыми эмодзи
// ============================================================================

// Неоновые эмодзи для Cyberpunk UI
export const CYBER_EMOJI = {
  // Основные иконки интерфейса
  CORE: '💠', // Главная/Ядро системы
  SQUARE: '🟦', // Кнопка/Элемент
  BOLT: '⚡️', // Энергия/Скорость
  BATTERY: '🔋', // Питание/Заряд
  SHIELD: '🛡', // Защита/Безопасность
  TERMINAL: '📟', // Терминал/Система

  // Навигация
  WAVE: '👋',
  SERVER: '🖥️',
  LOCATION: '🌍',
  ROCKET: '🚀',
  PROFILE: '👤',
  INSTRUCTIONS: '📖',
  REFERRAL: '👥',
  HELP: '❓',
  APPLE: '🍎',
  ANDROID: '🤖',
  WINDOWS: '🪟',
  MACOS: '🍏',
  BACK: '🔙',
  PREMIUM: '💎',
  FREE: '🆓',
  ACTIVE: '✅',
  INACTIVE: '❌',
  ID: '🆔',
  SUBSCRIPTION: '📅',
  TIME: '⏱️',
  TRAFFIC: '📊',
  KEY: '🔑',
  EXTEND: '💎',
  PHONE: '📱',
  MONEY: '💰',
  LINK: '🔗',
  CHART: '📊',
  CARD: '💳',
  CHECK: '✅',
  NO: '❌',
  ANTENNA: '📡',
  ARROW_RIGHT: '➡️',
  BULLET: '•',
  ONE: '1️⃣',
  TWO: '2️⃣',
  THREE: '3️⃣',
  BULB: '💡',
  CROSS: '✖️',
  PERCENT: '%',
  LOCK: '🔒',
  UNLOCK: '🔓',
} as const;

// Системные префиксы для терминального стиля
export const SYS_PREFIX = {
  AUTH_OK: '>_ [AUTH: OK]',
  UPLINK_EST: '>_ [UPLINK: ESTABLISHED]',
  STATUS_SECURE: '>_ [STATUS: SECURE]',
  INIT: '>_ [INIT]',
  CONNECT: '>_ [CONNECT]',
  LOAD: '>_ [LOAD]',
  READY: '>_ [READY]',
  PROCESS: '>_ [PROCESS]',
  COMPLETE: '>_ [COMPLETE]',
  WARNING: '>_ [WARNING]',
  ERROR: '>_ [ERROR]',
  SUCCESS: '>_ [SUCCESS]',
} as const;

// Пути к HUD-иконкам
export const HUD_ICONS = {
  BANNER: 'assets/images/hud-banner.svg',
  PROFILE: 'assets/images/hud-profile.svg',
  RENTAL: 'assets/images/hud-rental.svg',
  HELP: 'assets/images/hud-help.svg',
} as const;

// ============================================================================
// УТИЛИТЫ ДЛЯ ТЕРМИНАЛЬНОГО СТИЛЯ
// ============================================================================

export const TERMINAL = {
  // Оборачивает текст в моноширинный блок кода
  code: (text: string): string => `\`\`\`\n${text}\n\`\`\``,

  // Оборачивает в inline code
  inline: (text: string): string => `\`${text}\``,

  // Добавляет системный префикс
  prefix: (prefix: string, text: string): string => `${prefix} ${text}`,

  // Статусные сообщения с префиксами
  status: {
    auth: (text: string) => TERMINAL.prefix(SYS_PREFIX.AUTH_OK, text),
    uplink: (text: string) => TERMINAL.prefix(SYS_PREFIX.UPLINK_EST, text),
    secure: (text: string) => TERMINAL.prefix(SYS_PREFIX.STATUS_SECURE, text),
    init: (text: string) => TERMINAL.prefix(SYS_PREFIX.INIT, text),
    ready: (text: string) => TERMINAL.prefix(SYS_PREFIX.READY, text),
    process: (text: string) => TERMINAL.prefix(SYS_PREFIX.PROCESS, text),
    complete: (text: string) => TERMINAL.prefix(SYS_PREFIX.COMPLETE, text),
  },

  // Формирует заголовок в терминальном стиле
  header: (title: string): string => {
    const line = '═'.repeat(title.length + 4);
    return `${CYBER_EMOJI.CORE} ${title} ${CYBER_EMOJI.CORE}\n${line}`;
  },

  // Сообщение инициализации
  initMessage: (): string =>
    `${SYS_PREFIX.INIT} Инициализация протокола связи...\n` +
    `${SYS_PREFIX.CONNECT} Установка защищенного канала...\n` +
    `${SYS_PREFIX.AUTH_OK} Верификация пользователя завершена\n` +
    `${SYS_PREFIX.READY} Система готова к работе`,

  // Форматирование для меню
  menuItem: (emoji: string, label: string): string => `${emoji} ${label}`,
} as const;

// ============================================================================
// CYBERPUNK СООБЩЕНИЯ
// ============================================================================

export const CYBER_MESSAGES = {
  // Приветственное сообщение
  WELCOME: (firstName: string): string => {
    const header = TERMINAL.header('CLOUDNODE SECURE SYSTEM');
    const content =
      `Добро пожаловать, ${TERMINAL.inline(firstName || 'ПОЛЬЗОВАТЕЛЬ')}...\n\n` +
      `${CYBER_EMOJI.SERVER} Мощные VPS и выделенные серверы\n` +
      `${CYBER_EMOJI.LOCATION} Инфраструктура в Финляндии\n` +
      `${CYBER_EMOJI.BOLT} Высокая доступность и производительность\n\n` +
      `${TERMINAL.inline('Выберите действие из меню ниже:')}`;
    return `${header}\n\n${TERMINAL.code(content)}`;
  },

  // Системные сообщения
  SYSTEM_READY: TERMINAL.code(
    `${SYS_PREFIX.READY} Система активна и готова к работе\n` +
      `${SYS_PREFIX.STATUS_SECURE} Все протоколы безопасности включены`,
  ),

  PROCESSING: TERMINAL.code(
    `${SYS_PREFIX.PROCESS} Обработка запроса...\n` +
      `${SYS_PREFIX.LOAD} Загрузка данных из защищенного хранилища`,
  ),

  ACCESS_GRANTED: TERMINAL.code(
    `${SYS_PREFIX.SUCCESS} Доступ разрешен\n` +
      `${SYS_PREFIX.UPLINK_EST} Соединение установлено`,
  ),

  UNKNOWN_COMMAND: TERMINAL.code(
    `${SYS_PREFIX.ERROR} Неизвестная команда\n` +
      `${SYS_PREFIX.WARNING} Используйте меню для навигации`,
  ),

  BOT_NAME: 'CloudNode_Secure',
  DEFAULT_SUPPORT: '@support',
} as const;

// ============================================================================
// REPLY KEYBOARD КОНФИГУРАЦИЯ
// ============================================================================

// Главная кнопка запуска
export const MAIN_LAUNCH_BUTTON = `${CYBER_EMOJI.CORE} ЗАПУСТИТЬ СИСТЕМУ / ГЛАВНОЕ МЕНЮ`;

export const MAIN_BUTTON_ACTION = 'launch_system';

// Конфигурация reply keyboard
export const REPLY_KEYBOARD_CONFIG = {
  resize_keyboard: true,
  persistent: true,
} as const;

// ============================================================================
// МЕНЮ КНОПКА (setChatMenuButton)
// ============================================================================

export const MENU_BUTTON = {
  text: '🚀 ЗАПУСК',
  type: 'web_app', // или 'commands' для простой кнопки
  // Для обычной кнопки без web_app используем:
  // type: 'commands'
} as const;

// Альтернативная конфигурация для простой кнопки запуска
export const CHAT_MENU_BUTTON = {
  type: 'commands',
  text: '🚀 ЗАПУСК',
} as const;
