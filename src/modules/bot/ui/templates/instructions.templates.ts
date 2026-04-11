import { EMOJI, PLATFORM_APPS } from './common.templates';

// ============================================================================
// CYBERPUNK: ШАБЛОНЫ ИНСТРУКЦИЙ (Терминальный стиль)
// ============================================================================

const SYS = {
  MANUAL: '>_ [ИНСТРУКЦИЯ]',
  CONNECT: '>_ [ПОДКЛЮЧЕНИЕ]',
} as const;

const term = (text: string): string => `\`\`\`terminal\n${text}\n\`\`\``;

export const INSTRUCTIONS_MESSAGES = {
  SELECT_PLATFORM: term(
    `${SYS.MANUAL} Протокол подключения\n\n` +
      `${EMOJI.TERMINAL} Выберите вашу платформу:`,
  ),

  PLATFORM_INFO: (platform: string) => {
    const appName = PLATFORM_APPS[platform] || 'совместимый клиент';
    return term(
      `${SYS.MANUAL} Настройка ${platform.toUpperCase()}\n\n` +
        `${EMOJI.ONE} УСТАНОВКА: ${appName}\n` +
        `   └─ Источник: Только официальный магазин\n\n` +
        `${EMOJI.TWO} АВТОРИЗАЦИЯ: Получите ключ в Профиле\n` +
        `   └─ ${EMOJI.LOCK} Доступ к узлу\n\n` +
        `${EMOJI.THREE} ПОДКЛЮЧЕНИЕ: Импортируйте ключ\n` +
        `   └─ Статус: ${EMOJI.BOLT} Онлайн\n\n` +
        `${SYS.CONNECT} Поддержка: @support`,
    );
  },
} as const;

export const INSTRUCTIONS_ACTIONS = {
  INSTRUCTIONS: 'instructions',
  INSTRUCTION_IOS: 'instruction_ios',
  INSTRUCTION_ANDROID: 'instruction_android',
  INSTRUCTION_WINDOWS: 'instruction_windows',
  INSTRUCTION_MACOS: 'instruction_macos',
  BACK_TO_INSTRUCTIONS: 'back_to_instructions',
} as const;

export const INSTRUCTIONS_PATTERNS = {
  PLATFORM_INSTRUCTION: /^instruction_(.+)$/,
} as const;
