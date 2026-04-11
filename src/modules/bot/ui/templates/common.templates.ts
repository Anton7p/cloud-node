import { RentalPrice } from '../../types/bot.types';

// ============================================================================
// ЭМОДЗИ
// ============================================================================

export const EMOJI = {
  // Cyberpunk Core Icons
  CORE: '💠',
  SQUARE: '🟦',
  BOLT: '⚡️',
  BATTERY: '🔋',
  SHIELD: '🛡',
  TERMINAL: '📟',
  LOCK: '🔒',
  UNLOCK: '🔓',

  // Standard Icons
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
} as const;

// ============================================================================
// КОНСТАНТЫ ДАННЫХ
// ============================================================================

export const RENTAL_PRICES: RentalPrice[] = [
  { months: 1, price: 10, label: '1 месяц — 199 руб.' },
  { months: 3, price: 25, label: '3 месяца — 549 руб.' },
  { months: 12, price: 80, label: '12 месяцев — 1490 руб.' },
];

export const PLATFORM_APPS: Record<string, string> = {
  iOS: 'Shadowrocket или Streisand',
  Android: 'v2rayNG или NekoBox',
  Windows: 'v2rayN или NekoRay',
  macOS: 'Shadowrocket или V2RayXS',
};

// ============================================================================
// УТИЛИТЫ UI
// ============================================================================

export const UI_UTILS = {
  getMonthLabel: (months: number): string => {
    if (months === 1) return 'месяц';
    if (months >= 2 && months <= 4) return 'месяца';
    return 'месяцев';
  },

  generatePassword: (userId: number): string => {
    return Buffer.from(String(userId)).toString('base64').substring(0, 12);
  },

  getRentalPrice: (months: number): RentalPrice | undefined => {
    return RENTAL_PRICES.find((p) => p.months === months);
  },

  formatUserId: (telegramId: bigint): string => {
    return telegramId.toString();
  },
} as const;

// ============================================================================
// ОБЩИЕ СООБЩЕНИЯ
// ============================================================================

export const COMMON_MESSAGES = {
  UNKNOWN_COMMAND: 'Неизвестная команда',
  ERROR_OCCURRED: 'Произошла ошибка. Попробуйте позже.',
  BOT_NAME: 'CloudNode',
  DEFAULT_SUPPORT: '@support',
} as const;
