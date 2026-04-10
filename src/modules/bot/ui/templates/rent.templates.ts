import { EMOJI, RENTAL_PRICES, UI_UTILS } from './common.templates';

// ============================================================================
// ШАБЛОНЫ АРЕНДЫ
// ============================================================================

export const RENT_MESSAGES = {
  SELECT_TERM: () =>
    `${EMOJI.SERVER} *Аренда сервера*\n\n` +
    `Выберите срок аренды:\n\n` +
    RENTAL_PRICES.map((p) => `${EMOJI.BULLET} ${p.label}`).join('\n'),

  TERM_DETAILS: (months: number, priceLabel: string) => {
    const monthLabel = UI_UTILS.getMonthLabel(months);
    return (
      `${EMOJI.INSTRUCTIONS} *Детали аренды*\n\n` +
      `${EMOJI.SERVER} Услуга: Аренда VPS сервера\n` +
      `${EMOJI.LOCATION} Локация: Автоподбор (Финляндия)\n` +
      `${EMOJI.TIME} Срок: ${months} ${monthLabel}\n` +
      `${EMOJI.MONEY} Стоимость: ${priceLabel}\n\n` +
      `Для завершения оформления нажмите кнопку оплаты:`
    );
  },

  RENT_ACTIVATED: (endDate: string) =>
    `${EMOJI.CHECK} *Аренда активирована!*\n\n` +
    `${EMOJI.SERVER} Ваш сервер готов к использованию\n` +
    `${EMOJI.LOCATION} Локация: Финляндия\n` +
    `${EMOJI.TIME} Активен до: ${endDate}\n\n` +
    `Перейдите в профиль для получения доступа.`,

  NO_PENDING_RENTAL: `${EMOJI.NO} У вас нет ожидающих оплаты аренд. Начните сначала.`,
  ACTIVATION_ERROR: `${EMOJI.NO} Ошибка активации аренды. Попробуйте позже.`,
} as const;

export const RENT_ACTIONS = {
  RENT_SERVER: 'rent_server',
  RENT_1M: 'rent_1m',
  RENT_3M: 'rent_3m',
  RENT_12M: 'rent_12m',
  PAY_RENTAL: 'pay_rental',
} as const;

export const RENT_PATTERNS = {
  RENT_TERM: /^rent_(\d+)m$/,
} as const;
