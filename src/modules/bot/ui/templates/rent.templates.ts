import { EMOJI, RENTAL_PRICES, UI_UTILS } from './common.templates';

// ============================================================================
// CYBERPUNK: ШАБЛОНЫ АРЕНДЫ (Терминальный стиль)
// ============================================================================

const SYS = {
  RENTAL: '>_ [АРЕНДА]',
  PAYMENT: '>_ [ОПЛАТА]',
  SUCCESS: '>_ [УСПЕХ]',
  ERROR: '>_ [ОШИБКА]',
} as const;

const term = (text: string): string => `\`\`\`terminal\n${text}\n\`\`\``;

export const RENT_MESSAGES = {
  SELECT_TERM: () => {
    const prices = RENTAL_PRICES.map(
      (p) => `  ${EMOJI.SQUARE} ${p.label}`,
    ).join('\n');
    return term(
      `${SYS.RENTAL} Выберите срок аренды\n\n` +
        `${EMOJI.SERVER} ДОСТУПНЫЕ ТАРИФЫ:\n${prices}\n\n` +
        `${EMOJI.BOLT} Все узлы включают:\n` +
        `  + Безлимитный трафик\n` +
        `  + DDoS защита\n` +
        `  + Мониторинг 24/7`,
    );
  },

  TERM_DETAILS: (months: number, priceLabel: string) => {
    const monthLabel = UI_UTILS.getMonthLabel(months);
    return term(
      `${SYS.RENTAL} Конфигурация тарифа\n\n` +
        `${EMOJI.SERVER} УСЛУГА: VPS Узел\n` +
        `${EMOJI.LOCATION} РЕГИОН: FI-HEL (Авто)\n` +
        `${EMOJI.TIME} СРОК: ${months} ${monthLabel.toUpperCase()}\n` +
        `${EMOJI.BATTERY} СТОИМОСТЬ: ${priceLabel}\n\n` +
        `${SYS.PAYMENT} Перейти к оплате`,
    );
  },

  RENT_ACTIVATED: (endDate: string) =>
    term(
      `${SYS.SUCCESS} Узел активирован\n\n` +
        `${EMOJI.SERVER} СТАТУС: ОНЛАЙН\n` +
        `${EMOJI.LOCATION} РЕГИОН: ФИНЛЯНДИЯ\n` +
        `${EMOJI.TIME} ДОСТУП_ДО: ${endDate}\n\n` +
        `${EMOJI.LOCK} Данные доступны в профиле`,
    ),

  NO_PENDING_RENTAL: term(
    `${SYS.ERROR} Ожидающие платежи не найдены\n` +
      `${EMOJI.SQUARE} Начните аренду из меню`,
  ),

  ACTIVATION_ERROR: term(
    `${SYS.ERROR} Ошибка активации\n` +
      `${EMOJI.SQUARE} Свяжитесь с поддержкой: @support`,
  ),
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
