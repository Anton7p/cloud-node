import { User, RentalStatus } from '@prisma/client';
import { EMOJI } from './common.templates';
import { RentalData } from '../../types/bot.types';

// ============================================================================
// ШАБЛОНЫ ПРОФИЛЯ
// ============================================================================

export const PROFILE_MESSAGES = {
  NOT_FOUND: `${EMOJI.NO} Профиль не найден. Нажмите /start для регистрации.`,

  PROFILE: (user: User, rental: RentalData | undefined) => {
    const subscriptionEmoji = user.subscriptionType === 'premium' ? EMOJI.PREMIUM : EMOJI.FREE;
    const statusEmoji = user.status === 'active' ? EMOJI.ACTIVE : EMOJI.INACTIVE;

    let rentalInfo = '';
    if (rental && rental.status === RentalStatus.ACTIVE && rental.endDate) {
      const endDate = rental.endDate.toLocaleDateString('ru-RU');
      rentalInfo = `\n${EMOJI.SUBSCRIPTION} *Подписка:*\n` +
        `${EMOJI.TIME} Срок действия: до ${endDate}\n` +
        `${EMOJI.TRAFFIC} Трафик: Безлимитно\n`;
    } else {
      rentalInfo = `\n${EMOJI.SUBSCRIPTION} *Подписка:* Нет активной аренды\n`;
    }

    return `${EMOJI.PROFILE} *Ваш профиль*\n\n` +
      `${EMOJI.ID} ID: \`${user.telegramId}\`\n` +
      `${EMOJI.PROFILE} Username: @${user.username || 'не указан'}\n` +
      `${subscriptionEmoji} Тип: ${user.subscriptionType.toUpperCase()}\n` +
      `${statusEmoji} Статус: ${user.status === 'active' ? 'Активен' : 'Истек'}` +
      rentalInfo +
      `\n${EMOJI.TRAFFIC} Управление аккаунтом:`;
  },

  ACCESS_INFO: (userId: number, endDate: string, password: string) =>
    `${EMOJI.KEY} *Доступ к узлу*\n\n` +
    `${EMOJI.SERVER} Сервер: #${userId}-FIN\n` +
    `${EMOJI.LOCATION} Локация: Финляндия\n` +
    `${EMOJI.TIME} Активен до: ${endDate}\n\n` +
    `${EMOJI.ANTENNA} Подключение:\n` +
    `\`ssh user@${userId}-fin.cloudnode.ru\`\n\n` +
    `${EMOJI.SHIELD} Пароль: \`${password}\`\n\n` +
    `Сохраните эти данные!`,

  NO_ACTIVE_SERVERS: `${EMOJI.NO} *У вас нет активных серверов*\n\n` +
    `Арендуйте узел в главном меню, чтобы получить доступ.`,

  REFERRAL_TITLE: `${EMOJI.REFERRAL} *Партнерская программа*\n\n` +
    `Приглашайте друзей и получайте бонусы!\n\n` +
    `${EMOJI.MONEY} За каждого друга, который арендует сервер:\n` +
    `${EMOJI.BULLET} Вы получаете 10${EMOJI.PERCENT} от его первой оплаты\n` +
    `${EMOJI.BULLET} Друг получает скидку 5${EMOJI.PERCENT}\n\n` +
    `${EMOJI.LINK} *Ваша реферальная ссылка:*\n` +
    `\`https://t.me/CloudNodeBot?start=ref_\`\n\n` +
    `${EMOJI.CHART} Статистика будет доступна в ближайшем обновлении`,

  HELP_TITLE: `${EMOJI.HELP} *Помощь*\n\n` +
    `*Доступные команды:*\n` +
    `/start — Начать работу с ботом\n\n` +
    `*CloudNode — аренда вычислительных мощностей:*\n` +
    `Вы арендуете мощности на серверах в Финляндии,\n` +
    `а бот предоставляет технический доступ к ним.\n\n` +
    `*Как начать:*\n` +
    `${EMOJI.ONE} Перейдите в «${EMOJI.SERVER} Арендовать сервер»\n` +
    `${EMOJI.TWO} Выберите срок аренды и оплатите\n` +
    `${EMOJI.THREE} В профиле получите доступ к узлу\n\n` +
    `*Поддержка:* @support`,
} as const;

export const PROFILE_ACTIONS = {
  PROFILE: 'profile',
  GET_ACCESS: 'get_access',
  REFERRAL: 'referral',
  HELP: 'help',
} as const;
