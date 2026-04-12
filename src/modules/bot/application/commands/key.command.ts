import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RentalsService } from '../../../rentals/rentals.service';
import { MarzbanService } from '../../../integrations/providers/marzban/marzban.service';
import { BaseAction, CommandContext } from '../base.action';
import {
  MESSAGES,
  ACTIONS,
  IMAGES,
  ACCESS_PRICES,
  durationKeyboard,
  keyDisplayKeyboard,
  extendSuccessKeyboard,
} from '../../ui';

/**
 * Утилита для безопасного удаления сообщения
 */
async function safeDeleteMessage(ctx: CommandContext['ctx']): Promise<void> {
  try {
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.deleteMessage();
    }
  } catch (error) {
    // Игнорируем ошибку удаления
  }
}

@Injectable()
export class KeyCommand extends BaseAction {
  readonly pattern = ['key'];

  constructor(private readonly rentalsService: RentalsService) {
    super(KeyCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Режим одного окна: удаляем старое сообщение и отправляем новое
    await safeDeleteMessage(ctx);
    await this.sendDurationSelection(ctx, false);
  }

  /**
   * Отправляет экран выбора срока
   */
  private async sendDurationSelection(
    ctx: CommandContext['ctx'],
    isExtend: boolean = false,
  ): Promise<void> {
    try {
      const imagePath = path.resolve(IMAGES.KEY_HUD);
      const title = isExtend
        ? MESSAGES.EXTEND_DURATION_TITLE
        : MESSAGES.SELECT_DURATION;
      const keyboard = durationKeyboard();

      if (fs.existsSync(imagePath)) {
        await ctx.replyWithPhoto(
          { source: imagePath },
          {
            caption: title,
            reply_markup: keyboard.reply_markup,
          },
        );
      } else {
        await ctx.reply(title, {
          reply_markup: keyboard.reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send duration selection: ${error}`);
      const fallbackTitle = isExtend
        ? MESSAGES.EXTEND_DURATION_TITLE
        : MESSAGES.SELECT_DURATION;
      await ctx.reply(fallbackTitle, {
        reply_markup: durationKeyboard().reply_markup,
      });
    }
  }
}

@Injectable()
export class Month1Command extends BaseAction {
  readonly pattern = ACTIONS.MONTH_1;

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly marzbanService: MarzbanService,
  ) {
    super(Month1Command.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('month_1', userId);

    // Удаляем старое сообщение
    await safeDeleteMessage(ctx);

    const price = ACCESS_PRICES.find((p) => p.months === 1);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Проверяем, была ли активная аренда (это продление?)
    const hadActiveRental = await this.rentalsService.hasActiveRental(userId);

    // Создаем pending rental
    await this.rentalsService.createPendingRental(userId, 1);

    // Активируем/продлеваем аренду
    const rental = await this.rentalsService.activateRental(userId);
    if (!rental) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    if (hadActiveRental) {
      // ПРОДЛЕНИЕ - показываем информацию о продлении без ключа
      const endDate = rental.endDate
        ? new Date(rental.endDate).toLocaleDateString('ru-RU')
        : 'неизвестно';
      await ctx.reply(MESSAGES.EXTEND_SUCCESS(endDate), {
        reply_markup: extendSuccessKeyboard().reply_markup,
      });
      return;
    }

    // НОВАЯ ПОКУПКА - создаем пользователя в Marzban и показываем ключ
    const result = await this.marzbanService.createUser(String(userId), 1);

    if (!result.success || !result.subscriptionUrl) {
      this.logger.error(`Failed to create Marzban user: ${result.error}`);
      await ctx.reply('❌ Ошибка создания ключа. Обратитесь в поддержку.');
      return;
    }

    // Сохраняем ключ
    await this.rentalsService.updateAccessKey(
      rental.id,
      result.subscriptionUrl,
    );

    // Отправляем ключ пользователю
    await this.sendKey(ctx, price.label, result.subscriptionUrl);
  }

  private async sendKey(
    ctx: CommandContext['ctx'],
    duration: string,
    key: string,
  ): Promise<void> {
    try {
      // Отправляем ключ с большой кнопкой СКОПИРОВАТЬ
      await ctx.reply(MESSAGES.KEY_READY(duration, key), {
        parse_mode: 'Markdown',
        reply_markup: keyDisplayKeyboard(key).reply_markup,
      });
    } catch (error) {
      this.logger.error(`Failed to send key: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}

@Injectable()
export class Month3Command extends BaseAction {
  readonly pattern = ACTIONS.MONTH_3;

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly marzbanService: MarzbanService,
  ) {
    super(Month3Command.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('month_3', userId);

    // Удаляем старое сообщение
    await safeDeleteMessage(ctx);

    const price = ACCESS_PRICES.find((p) => p.months === 3);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Проверяем, была ли активная аренда (это продление?)
    const hadActiveRental = await this.rentalsService.hasActiveRental(userId);

    // Создаем pending rental
    await this.rentalsService.createPendingRental(userId, 3);

    // Активируем/продлеваем аренду
    const rental = await this.rentalsService.activateRental(userId);
    if (!rental) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    if (hadActiveRental) {
      // ПРОДЛЕНИЕ - показываем информацию о продлении без ключа
      const endDate = rental.endDate
        ? new Date(rental.endDate).toLocaleDateString('ru-RU')
        : 'неизвестно';
      await ctx.reply(MESSAGES.EXTEND_SUCCESS(endDate), {
        reply_markup: extendSuccessKeyboard().reply_markup,
      });
      return;
    }

    // НОВАЯ ПОКУПКА - создаем пользователя в Marzban и показываем ключ
    const result = await this.marzbanService.createUser(String(userId), 3);

    if (!result.success || !result.subscriptionUrl) {
      this.logger.error(`Failed to create Marzban user: ${result.error}`);
      await ctx.reply('❌ Ошибка создания ключа. Обратитесь в поддержку.');
      return;
    }

    // Сохраняем ключ
    await this.rentalsService.updateAccessKey(
      rental.id,
      result.subscriptionUrl,
    );

    // Отправляем ключ пользователю
    await this.sendKey(ctx, price.label, result.subscriptionUrl);
  }

  private async sendKey(
    ctx: CommandContext['ctx'],
    duration: string,
    key: string,
  ): Promise<void> {
    try {
      // Отправляем ключ с большой кнопкой СКОПИРОВАТЬ
      await ctx.reply(MESSAGES.KEY_READY(duration, key), {
        parse_mode: 'Markdown',
        reply_markup: keyDisplayKeyboard(key).reply_markup,
      });
    } catch (error) {
      this.logger.error(`Failed to send key: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}

@Injectable()
export class CopyKeyCommand extends BaseAction {
  readonly pattern = /^copy_key:/;

  constructor() {
    super(CopyKeyCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution('copy_key', userId);

    // Извлекаем ключ из callback data (copy_key:ключ)
    const key = data?.replace('copy_key:', '') || '';

    if (!key) {
      await ctx.reply('❌ Ошибка: ключ не найден');
      return;
    }

    // Отправляем ключ отдельным сообщением без кнопок (легко копировать)
    await ctx.reply(
      `📋 Ваш ключ:\n\n\`\`\`\n${key}\n\`\`\`\n\n✅ Нажмите на ключ выше, чтобы скопировать его`,
      { parse_mode: 'Markdown' },
    );
  }
}

@Injectable()
export class MyKeyCommand extends BaseAction {
  readonly pattern = [ACTIONS.MY_KEY, 'mykey'];

  constructor(private readonly rentalsService: RentalsService) {
    super(MyKeyCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('my_key', userId);

    // Получаем активную аренду
    const rental = await this.rentalsService.getActiveRental(userId);

    if (!rental || !rental.accessKey) {
      await ctx.reply(MESSAGES.NO_KEY);
      return;
    }

    // Получаем расшифрованный ключ
    const key = await this.rentalsService.getDecryptedAccessKey(rental);

    if (!key) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Показываем ключ с кнопкой копирования
    await ctx.reply(MESSAGES.MY_KEY_TITLE, { parse_mode: 'Markdown' });
    await ctx.reply(`\`\`\`\n${key}\n\`\`\``, {
      parse_mode: 'Markdown',
      reply_markup: keyDisplayKeyboard(key).reply_markup,
    });
  }
}

// ============================================================================
// Новые команды для разных сроков подписки
// ============================================================================

/**
 * Бесплатный тест на 3 дня
 */
@Injectable()
export class FreeTestCommand extends BaseAction {
  readonly pattern = ACTIONS.FREE_TEST;

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly marzbanService: MarzbanService,
  ) {
    super(FreeTestCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('free_test', userId);

    // Удаляем старое сообщение
    await safeDeleteMessage(ctx);

    const price = ACCESS_PRICES.find((p) => p.months === 0);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Проверяем активную аренду
    const hadActiveRental = await this.rentalsService.hasActiveRental(userId);

    // Создаем pending rental для 3 дней (0.1 месяца примерно)
    await this.rentalsService.createPendingRental(userId, 0.1);

    // Активируем аренду
    const rental = await this.rentalsService.activateRental(userId);
    if (!rental) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    if (hadActiveRental) {
      const endDate = rental.endDate
        ? new Date(rental.endDate).toLocaleDateString('ru-RU')
        : 'неизвестно';
      await ctx.reply(MESSAGES.EXTEND_SUCCESS(endDate), {
        reply_markup: extendSuccessKeyboard().reply_markup,
      });
      return;
    }

    // Создаем пользователя в Marzban
    const result = await this.marzbanService.createUser(String(userId), 0.1);

    if (!result.success || !result.subscriptionUrl) {
      this.logger.error(`Failed to create Marzban user: ${result.error}`);
      await ctx.reply('❌ Ошибка создания ключа. Обратитесь в поддержку.');
      return;
    }

    await this.rentalsService.updateAccessKey(
      rental.id,
      result.subscriptionUrl,
    );
    await this.sendKey(ctx, price.label, result.subscriptionUrl);
  }

  private async sendKey(
    ctx: CommandContext['ctx'],
    duration: string,
    key: string,
  ): Promise<void> {
    try {
      await ctx.reply(MESSAGES.KEY_READY(duration, key), {
        parse_mode: 'Markdown',
        reply_markup: keyDisplayKeyboard(key).reply_markup,
      });
    } catch (error) {
      this.logger.error(`Failed to send key: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}

/**
 * Подписка на неделю
 */
@Injectable()
export class WeekCommand extends BaseAction {
  readonly pattern = ACTIONS.WEEK;

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly marzbanService: MarzbanService,
  ) {
    super(WeekCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('week', userId);

    // Удаляем старое сообщение
    await safeDeleteMessage(ctx);

    const price = ACCESS_PRICES.find((p) => p.months === 0.25);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    const hadActiveRental = await this.rentalsService.hasActiveRental(userId);
    await this.rentalsService.createPendingRental(userId, 0.25);

    const rental = await this.rentalsService.activateRental(userId);
    if (!rental) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    if (hadActiveRental) {
      const endDate = rental.endDate
        ? new Date(rental.endDate).toLocaleDateString('ru-RU')
        : 'неизвестно';
      await ctx.reply(MESSAGES.EXTEND_SUCCESS(endDate), {
        reply_markup: extendSuccessKeyboard().reply_markup,
      });
      return;
    }

    const result = await this.marzbanService.createUser(String(userId), 0.25);

    if (!result.success || !result.subscriptionUrl) {
      this.logger.error(`Failed to create Marzban user: ${result.error}`);
      await ctx.reply('❌ Ошибка создания ключа. Обратитесь в поддержку.');
      return;
    }

    await this.rentalsService.updateAccessKey(
      rental.id,
      result.subscriptionUrl,
    );
    await this.sendKey(ctx, price.label, result.subscriptionUrl);
  }

  private async sendKey(
    ctx: CommandContext['ctx'],
    duration: string,
    key: string,
  ): Promise<void> {
    try {
      await ctx.reply(MESSAGES.KEY_READY(duration, key), {
        parse_mode: 'Markdown',
        reply_markup: keyDisplayKeyboard(key).reply_markup,
      });
    } catch (error) {
      this.logger.error(`Failed to send key: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}

/**
 * Подписка на 6 месяцев
 */
@Injectable()
export class Month6Command extends BaseAction {
  readonly pattern = ACTIONS.MONTH_6;

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly marzbanService: MarzbanService,
  ) {
    super(Month6Command.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('month_6', userId);

    // Удаляем старое сообщение
    await safeDeleteMessage(ctx);

    const price = ACCESS_PRICES.find((p) => p.months === 6);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    const hadActiveRental = await this.rentalsService.hasActiveRental(userId);
    await this.rentalsService.createPendingRental(userId, 6);

    const rental = await this.rentalsService.activateRental(userId);
    if (!rental) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    if (hadActiveRental) {
      const endDate = rental.endDate
        ? new Date(rental.endDate).toLocaleDateString('ru-RU')
        : 'неизвестно';
      await ctx.reply(MESSAGES.EXTEND_SUCCESS(endDate), {
        reply_markup: extendSuccessKeyboard().reply_markup,
      });
      return;
    }

    const result = await this.marzbanService.createUser(String(userId), 6);

    if (!result.success || !result.subscriptionUrl) {
      this.logger.error(`Failed to create Marzban user: ${result.error}`);
      await ctx.reply('❌ Ошибка создания ключа. Обратитесь в поддержку.');
      return;
    }

    await this.rentalsService.updateAccessKey(
      rental.id,
      result.subscriptionUrl,
    );
    await this.sendKey(ctx, price.label, result.subscriptionUrl);
  }

  private async sendKey(
    ctx: CommandContext['ctx'],
    duration: string,
    key: string,
  ): Promise<void> {
    try {
      await ctx.reply(MESSAGES.KEY_READY(duration, key), {
        parse_mode: 'Markdown',
        reply_markup: keyDisplayKeyboard(key).reply_markup,
      });
    } catch (error) {
      this.logger.error(`Failed to send key: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}
