import { EMOJI, PLATFORM_APPS } from './common.templates';

// ============================================================================
// ШАБЛОНЫ ИНСТРУКЦИЙ
// ============================================================================

export const INSTRUCTIONS_MESSAGES = {
  SELECT_PLATFORM: `${EMOJI.INSTRUCTIONS} *Инструкции по подключению*\n\n` +
    `Выберите вашу платформу:`,

  PLATFORM_INFO: (platform: string) => {
    const appName = PLATFORM_APPS[platform] || 'приложение для вашей платформы';
    return `${EMOJI.PHONE} *Инструкция для ${platform}*\n\n` +
      `${EMOJI.ONE} Скачайте приложение *${appName}* из официального магазина\n\n` +
      `${EMOJI.TWO} Скопируйте ключ подключения из раздела «${EMOJI.KEY} Получить доступ к узлу» в вашем Профиле\n\n` +
      `${EMOJI.THREE} Вставьте ключ в приложение и нажмите *Подключиться*\n\n` +
      `${EMOJI.BULB} Если нужна помощь — обратитесь в поддержку @support`;
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
