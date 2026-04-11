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
} from '../../ui';

@Injectable()
export class KeyCommand extends BaseAction {
  readonly pattern = [ACTIONS.GET_KEY, ACTIONS.EXTEND_KEY, 'key'];

  constructor(private readonly rentalsService: RentalsService) {
    super(KeyCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Определяем режим (получение или продление)
    const isExtend = data === ACTIONS.EXTEND_KEY;

    // Если callback_query - редактируем сообщение
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await this.editToDurationSelection(ctx, isExtend);
    } else {
      // Если команда /key - отправляем новое сообщение
      await ctx.reply(MESSAGES.SELECT_DURATION, {
        reply_markup: durationKeyboard(isExtend).reply_markup,
      });
    }
  }

  /**
   * Редактирует текущее сообщение на экран выбора срока
   */
  private async editToDurationSelection(
    ctx: CommandContext['ctx'],
    isExtend: boolean = false,
  ): Promise<void> {
    try {
      const imagePath = path.resolve(IMAGES.START_HUD);
      const keyboard = durationKeyboard(isExtend);

      // Пробуем использовать editMessageMedia для смены фото + текста
      if (fs.existsSync(imagePath)) {
        try {
          await ctx.editMessageMedia(
            {
              type: 'photo',
              media: { source: imagePath },
              caption: MESSAGES.SELECT_DURATION,
            },
            { reply_markup: keyboard.reply_markup },
          );
        } catch {
          // Fallback на редактирование текста/caption
          await ctx.editMessageCaption(MESSAGES.SELECT_DURATION, {
            reply_markup: keyboard.reply_markup,
          });
        }
      } else {
        await ctx.editMessageText(MESSAGES.SELECT_DURATION, {
          reply_markup: keyboard.reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to edit message: ${error}`);
      // Fallback на новое сообщение
      await ctx.reply(MESSAGES.SELECT_DURATION, {
        reply_markup: durationKeyboard(isExtend).reply_markup,
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

    const price = ACCESS_PRICES.find((p) => p.months === 1);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Создаем pending rental
    await this.rentalsService.createPendingRental(userId, 1);

    // Активируем/продлеваем аренду
    const rental = await this.rentalsService.activateRental(userId);
    if (!rental) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Создаем пользователя в Marzban
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
      await ctx.reply(MESSAGES.KEY_READY(duration, key, MESSAGES.NODES_INFO), {
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

    const price = ACCESS_PRICES.find((p) => p.months === 3);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Создаем pending rental
    await this.rentalsService.createPendingRental(userId, 3);

    // Активируем/продлеваем аренду
    const rental = await this.rentalsService.activateRental(userId);
    if (!rental) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Создаем пользователя в Marzban
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
      await ctx.reply(MESSAGES.KEY_READY(duration, key, MESSAGES.NODES_INFO), {
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
