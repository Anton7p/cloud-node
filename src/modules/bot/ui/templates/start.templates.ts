import { EMOJI } from './common.templates';

// ============================================================================
// CYBERPUNK: ШАБЛОНЫ СТАРТА И ГЛАВНОГО МЕНЮ
// ============================================================================

// Системные префиксы терминала
const SYS = {
  AUTH_OK: '>_ [AUTH: OK]',
  UPLINK: '>_ [UPLINK: ESTABLISHED]',
  STATUS: '>_ [STATUS: SECURE]',
  INIT: '>_ [INIT]',
  READY: '>_ [READY]',
  PROCESS: '>_ [PROCESS]',
} as const;

// Утилита для терминального блока
const term = (text: string): string => `\`\`\`terminal\n${text}\n\`\`\``;

export const START_MESSAGES = {
  // Приветствие с терминальным оформлением
  WELCOME: (firstName: string) => {
    const header = `${EMOJI.CORE} CLOUDNODE SECURE SYSTEM v2.0`;
    const separator = '═'.repeat(38);
    const content =
      `${SYS.AUTH_OK} Пользователь ${firstName || 'USER'} авторизован\n` +
      `${SYS.UPLINK} Защищенный канал установлен\n` +
      `${SYS.STATUS} Все протоколы безопасности активны\n\n` +
      `${EMOJI.SERVER} Высокопроизводительная VPS инфраструктура\n` +
      `${EMOJI.LOCATION} Датацентры в Финляндии\n` +
      `${EMOJI.BOLT} Гарантия доступности 99.9%\n\n` +
      `${SYS.READY} Ожидание команды...`;
    return `${header}\n${separator}\n${term(content)}`;
  },

  // Инициализация (показывается при нажатии кнопок)
  INIT: term(
    `${SYS.INIT} Инициализация протокола...\n` +
      `${SYS.PROCESS} Загрузка защитных модулей...`,
  ),

  USER_REGISTERED: (userId: number) =>
    term(`${SYS.AUTH_OK} Новый пользователь зарегистрирован: ${userId}`),

  WELCOME_BACK: (firstName: string) =>
    term(`${SYS.AUTH_OK} С возвращением, ${firstName || 'USER'}`),

  // Системное сообщение о готовности
  SYSTEM_READY: term(
    `${SYS.READY} Система активна\n` +
      `${SYS.STATUS} Шифрование: ВКЛЮЧЕНО\n` +
      `${SYS.STATUS} Фаервол: АКТИВЕН`,
  ),
} as const;

export const START_ACTIONS = {
  START: 'start',
  BACK_TO_START: 'back_to_start',
  LAUNCH: 'launch_system',
} as const;
