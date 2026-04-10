// ============================================================================
// ШАБЛОНЫ НАВИГАЦИИ
// ============================================================================

export const NAVIGATION_ACTIONS = {
  PROFILE: 'profile',
  RENT_SERVER: 'rent_server',
  INSTRUCTIONS: 'instructions',
  REFERRAL: 'referral',
  HELP: 'help',

  BACK_TO_START: 'back_to_start',
  BACK_TO_INSTRUCTIONS: 'back_to_instructions',

  GET_ACCESS: 'get_access',

  RENT_1M: 'rent_1m',
  RENT_3M: 'rent_3m',
  RENT_12M: 'rent_12m',
  PAY_RENTAL: 'pay_rental',

  INSTRUCTION_IOS: 'instruction_ios',
  INSTRUCTION_ANDROID: 'instruction_android',
  INSTRUCTION_WINDOWS: 'instruction_windows',
  INSTRUCTION_MACOS: 'instruction_macos',
} as const;

export type NavigationAction =
  (typeof NAVIGATION_ACTIONS)[keyof typeof NAVIGATION_ACTIONS];

export const NAVIGATION_LABELS = {
  PROFILE: 'Мой профиль',
  RENT_SERVER: 'Арендовать сервер',
  INSTRUCTIONS: 'Инструкции',
  REFERRAL: 'Партнерская программа',
  HELP: 'Помощь',
  GET_ACCESS: 'Получить доступ к узлу',
  EXTEND_RENTAL: 'Расширить аренду',
  PAY: 'Оплатить аренду',
  BACK: 'Назад',
  BACK_TO_MENU: 'В главное меню',
  BACK_TO_PROFILE: 'Назад в профиль',
  OTHER_PLATFORMS: 'Другие платформы',

  RENT_1M: '1 месяц',
  RENT_3M: '3 месяца',
  RENT_12M: '12 месяцев',
  OTHER_TERM: 'Выбрать другой срок',

  IOS: 'iOS',
  ANDROID: 'Android',
  WINDOWS: 'Windows',
  MACOS: 'macOS',
} as const;
