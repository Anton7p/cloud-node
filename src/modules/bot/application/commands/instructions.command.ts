import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import {
  MESSAGES,
  ACTIONS,
  platformKeyboard,
  platformDetailKeyboard,
} from '../../ui';
import { PLATFORM_GUIDES } from '../../ui/templates/clean.templates';

@Injectable()
export class InstructionsCommand extends BaseAction {
  readonly pattern = [ACTIONS.INSTRUCTIONS, 'help'];

  constructor() {
    super(InstructionsCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Режим одного окна: удаляем старое сообщение и отправляем новое
    await safeDeleteMessage(ctx);
    await ctx.reply(MESSAGES.INSTRUCTIONS_TITLE, {
      reply_markup: platformKeyboard().reply_markup,
    });
  }
}

// Маппинг платформ для универсальной команды
const PLATFORM_CONFIG = {
  [ACTIONS.PLATFORM_IOS]: { name: 'iOS', guide: PLATFORM_GUIDES.IOS },
  [ACTIONS.PLATFORM_ANDROID]: {
    name: 'Android',
    guide: PLATFORM_GUIDES.ANDROID,
  },
  [ACTIONS.PLATFORM_WINDOWS]: {
    name: 'Windows',
    guide: PLATFORM_GUIDES.WINDOWS,
  },
  [ACTIONS.PLATFORM_MACOS]: { name: 'macOS', guide: PLATFORM_GUIDES.MACOS },
} as const;

@Injectable()
export class PlatformInstructionsCommand extends BaseAction {
  readonly pattern = [
    ACTIONS.PLATFORM_IOS,
    ACTIONS.PLATFORM_ANDROID,
    ACTIONS.PLATFORM_WINDOWS,
    ACTIONS.PLATFORM_MACOS,
  ];

  constructor() {
    super(PlatformInstructionsCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    const platform = PLATFORM_CONFIG[data];
    if (!platform) {
      return;
    }

    // Режим одного окна: удаляем старое сообщение и отправляем новое
    await safeDeleteMessage(ctx);
    await ctx.reply(MESSAGES.PLATFORM_TITLE(platform.name), {
      reply_markup: platformDetailKeyboard(platform.guide).reply_markup,
    });
  }
}
