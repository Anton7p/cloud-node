import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BaseAction, CommandContext } from '../base.action';
import {
  RENT_MESSAGES,
  RENT_ACTIONS,
  rentServerKeyboard,
  HUD_ICONS,
} from '../../ui';

@Injectable()
export class RentServerCommand extends BaseAction {
  readonly pattern = RENT_ACTIONS.RENT_SERVER;

  constructor() {
    super(RentServerCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx } = context;
    this.logExecution(context.data, context.userId);

    // Typing эффект для атмосферы
    await ctx.sendChatAction('typing');

    // Отправка HUD иконки аренды
    await this.sendHudIcon(ctx, HUD_ICONS.RENTAL);

    await ctx.reply(RENT_MESSAGES.SELECT_TERM(), {
      parse_mode: 'Markdown',
      ...rentServerKeyboard(),
    });
  }

  /**
   * Отправляет HUD иконку если файл существует
   */
  private async sendHudIcon(
    ctx: CommandContext['ctx'],
    iconPath: string,
  ): Promise<void> {
    try {
      const fullPath = path.resolve(iconPath);
      if (fs.existsSync(fullPath)) {
        await ctx.replyWithPhoto({ source: fullPath });
      }
    } catch (error) {
      // Иконка не критична, продолжаем без неё
    }
  }
}
