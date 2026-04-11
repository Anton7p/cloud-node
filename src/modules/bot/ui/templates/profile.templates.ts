import { User, RentalStatus } from '@prisma/client';
import { EMOJI } from './common.templates';
import { RentalData } from '../../types/bot.types';

// ============================================================================
// CYBERPUNK: ШАБЛОНЫ ПРОФИЛЯ (Терминальный стиль)
// ============================================================================

// Системные префиксы
const SYS = {
  AUTH_OK: '>_ [AUTH: OK]',
  STATUS: '>_ [STATUS]',
  ACCESS: '>_ [ACCESS]',
  ERROR: '>_ [ERROR]',
} as const;

// Утилита для терминального блока
const term = (text: string): string => `\`\`\`terminal\n${text}\n\`\`\``;

export const PROFILE_MESSAGES = {
  NOT_FOUND: term(
    `${SYS.ERROR} Профиль не найден\n` +
      `${SYS.STATUS} Выполните /start для регистрации`,
  ),

  PROFILE: (user: User, rental: RentalData | undefined) => {
    const subscriptionType =
      user.subscriptionType === 'premium' ? 'ПРЕМИУМ' : 'СТАНДАРТ';
    const statusCode = user.status === 'active' ? 'ОНЛАЙН' : 'ОФФЛАЙН';

    let rentalInfo = '';
    if (rental && rental.status === RentalStatus.ACTIVE && rental.endDate) {
      const endDate = rental.endDate.toLocaleDateString('ru-RU');
      rentalInfo =
        `\n${EMOJI.BATTERY} ПОДПИСКА: АКТИВНА\n` +
        `${EMOJI.TIME} ИСТЕКАЕТ: ${endDate}\n` +
        `${EMOJI.BOLT} ТРАФИК: БЕЗЛИМИТ\n`;
    } else {
      rentalInfo = `\n${EMOJI.BATTERY} ПОДПИСКА: НЕТ\n`;
    }

    const content =
      `${SYS.AUTH_OK} Личность подтверждена\n\n` +
      `${EMOJI.ID} ID: ${user.telegramId}\n` +
      `${EMOJI.TERMINAL} НИК: @${user.username || 'нет'}\n` +
      `${EMOJI.SHIELD} ТАРИФ: ${subscriptionType}\n` +
      `${EMOJI.CORE} СТАТУС: ${statusCode}` +
      rentalInfo +
      `\n${EMOJI.SQUARE} Выберите операцию:`;

    return term(content);
  },

  ACCESS_INFO: (userId: number, endDate: string, password: string) => {
    const content =
      `${SYS.ACCESS} Доступ к узлу разрешен\n\n` +
      `${EMOJI.SERVER} УЗЕЛ: #${userId}-FIN\n` +
      `${EMOJI.LOCATION} РЕГИОН: FI-HEL\n` +
      `${EMOJI.TIME} ДОСТУП_ДО: ${endDate}\n\n` +
      `${EMOJI.ANTENNA} ТОЧКА_ПОДКЛЮЧЕНИЯ:\n` +
      `ssh user@${userId}-fin.cloudnode.ru\n\n` +
      `${EMOJI.LOCK} ТОКЕН: ${password}\n\n` +
      `${SYS.STATUS} Храните данные безопасно`;
    return term(content);
  },

  NO_ACTIVE_SERVERS: term(
    `${SYS.ERROR} Активные узлы не найдены\n\n` +
      `${EMOJI.SQUARE} Арендуйте сервер в меню\n` +
      `${EMOJI.SQUARE} для подключения`,
  ),

  REFERRAL_TITLE: term(
    `${EMOJI.BATTERY} ПАРТНЕРСКАЯ ПРОГРАММА\n\n` +
      `${SYS.STATUS} Приглашайте, получайте бонусы\n\n` +
      `${EMOJI.BOLT} За каждого приглашенного:\n` +
      `  + 10% от первой оплаты вам\n` +
      `  + 5% скидка им\n\n` +
      `${EMOJI.LOCK} РЕФ_ССЫЛКА:\n` +
      `https://t.me/CloudNodeBot?start=ref_\n\n` +
      `${SYS.STATUS} Статистика: в версии 2.1`,
  ),

  HELP_TITLE: term(
    `${EMOJI.TERMINAL} ДОКУМЕНТАЦИЯ СИСТЕМЫ\n\n` +
      `${EMOJI.SQUARE} /start - Запуск системы\n\n` +
      `${EMOJI.CORE} CloudNode Secure Infrastructure\n` +
      `${EMOJI.LOCATION} Датацентры в Финляндии\n` +
      `${EMOJI.SHIELD} Только зашифрованные подключения\n\n` +
      `${EMOJI.BOLT} БЫСТРЫЙ СТАРТ:\n` +
      `  1. Арендуйте сервер в меню\n` +
      `  2. Завершите оплату\n` +
      `  3. Получите данные в профиле\n\n` +
      `${EMOJI.ANTENNA} Поддержка: @support`,
  ),
} as const;

export const PROFILE_ACTIONS = {
  PROFILE: 'profile',
  GET_ACCESS: 'get_access',
  REFERRAL: 'referral',
  HELP: 'help',
} as const;
