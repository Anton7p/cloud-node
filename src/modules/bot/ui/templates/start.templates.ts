import { EMOJI } from './common.templates';

// ============================================================================
// ШАБЛОНЫ СТАРТА И ГЛАВНОГО МЕНЮ
// ============================================================================

export const START_MESSAGES = {
  WELCOME: (firstName: string) =>
    `${EMOJI.WAVE} Привет, ${firstName || 'друг'}!\n\n` +
    `Добро пожаловать в CloudNode — аренда облачных серверов и доступ к инфраструктуре.\n\n` +
    `${EMOJI.SERVER} Мощные VPS и выделенные серверы\n` +
    `${EMOJI.LOCATION} Инфраструктура в Финляндии\n` +
    `${EMOJI.ROCKET} Высокая доступность и производительность\n\n` +
    `Выберите действие ниже:`,

  USER_REGISTERED: (userId: number) =>
    `Новый пользователь зарегистрирован: ${userId}`,

  WELCOME_BACK: (firstName: string) =>
    `${EMOJI.WAVE} С возвращением, ${firstName || 'друг'}!`,
} as const;

export const START_ACTIONS = {
  START: 'start',
  BACK_TO_START: 'back_to_start',
} as const;
