import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BaseAction, CommandContext } from '../base.action';
import {
  PROFILE_MESSAGES,
  PROFILE_ACTIONS,
  helpKeyboard,
  HUD_ICONS,
} from '../../ui';

@Injectable()
export class HelpCommand extends BaseAction {
  readonly pattern = PROFILE_ACTIONS.HELP;

  constructor() {
    super(HelpCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx } = context;
    this.logExecution(context.data, context.userId);

    // Typing эффект для атмосферы
    await ctx.sendChatAction('typing');

    // Отправка HUD иконки помощи
    await this.sendHudIcon(ctx, HUD_ICONS.HELP);

    await ctx.reply(PROFILE_MESSAGES.HELP_TITLE, {
      parse_mode: 'Markdown',
      ...helpKeyboard(),
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
