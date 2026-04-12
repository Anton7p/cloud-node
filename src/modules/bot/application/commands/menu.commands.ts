import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import {
  MESSAGES,
  ACTIONS,
  durationKeyboard,
  partnersKeyboard,
  legalKeyboard,
  emptyKeysKeyboard,
} from '../../ui';
import { RentalsService } from '../../../rentals/rentals.service';
import { UsersService } from '../../../users/users.service';
import dayjs from 'dayjs';

/**
 * Быстрый старт - Экран выбора тарифа
 */
@Injectable()
export class BuyMenuCommand extends BaseAction {
  readonly pattern = ACTIONS.BUY_MENU;

  constructor() {
    super(BuyMenuCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Режим одного окна: удаляем старое сообщение
    await safeDeleteMessage(ctx);

    // Отправляем новое сообщение
    await ctx.reply(MESSAGES.SELECT_DURATION, {
      reply_markup: durationKeyboard().reply_markup,
    });
  }
}

/**
 * Мои ключи - Экран с ключами пользователя
 */
@Injectable()
export class MyKeysCommand extends BaseAction {
  readonly pattern = [ACTIONS.MY_KEYS, 'my_keys'];

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly usersService: UsersService,
  ) {
    super(MyKeysCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Получаем активную аренду
    const rental = await this.rentalsService.getActiveRental(userId);

    // Режим одного окна: удаляем старое сообщение
    await safeDeleteMessage(ctx);

    if (!rental || !rental.accessKey) {
      // Показываем экран "Пока пусто"
      await this.sendEmptyKeysScreen(ctx);
      return;
    }

    // Показываем активный ключ
    const endDate = dayjs(rental.endDate).format('DD.MM.YYYY');
    const key = await this.rentalsService.getDecryptedAccessKey(rental);

    if (!key) {
      await this.sendEmptyKeysScreen(ctx);
      return;
    }

    // Отправляем ключ
    const caption = MESSAGES.MY_KEYS_ACTIVE(endDate, key);
    const keyboard = emptyKeysKeyboard();

    try {
      await ctx.reply(caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      this.logger.error(`Failed to send my keys: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }

  private async sendEmptyKeysScreen(ctx: CommandContext['ctx']): Promise<void> {
    try {
      await ctx.reply(MESSAGES.NO_KEY, {
        reply_markup: emptyKeysKeyboard().reply_markup,
      });
    } catch (error) {
      this.logger.warn(`Failed to send empty keys: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}

/**
 * Партнёрская программа
 */
@Injectable()
export class PartnersCommand extends BaseAction {
  readonly pattern = ACTIONS.PARTNERS;

  constructor(private readonly usersService: UsersService) {
    super(PartnersCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Генерируем реферальную ссылку
    // TODO: добавить referralCount в схему пользователя
    const referralCount = 0; // Заглушка, пока не добавлено поле в схему
    const botUsername = ctx.botInfo?.username || 'your_bot';
    const referralLink = `https://t.me/${botUsername}?start=ref_${userId}`;

    // Режим одного окна: удаляем старое сообщение
    await safeDeleteMessage(ctx);

    // Отправляем новое сообщение
    await ctx.reply(MESSAGES.PARTNERS_TITLE(referralLink, referralCount), {
      reply_markup: partnersKeyboard(referralLink).reply_markup,
    });
  }
}

/**
 * Условия и Поддержка
 */
@Injectable()
export class LegalCommand extends BaseAction {
  readonly pattern = ACTIONS.LEGAL;

  constructor() {
    super(LegalCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Режим одного окна: удаляем старое сообщение
    await safeDeleteMessage(ctx);

    // Отправляем новое сообщение
    await ctx.reply(MESSAGES.SUPPORT, {
      reply_markup: legalKeyboard().reply_markup,
    });
  }
}
