import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import {
  MESSAGES,
  ACTIONS,
  PLATFORM_LINKS,
  platformDetailKeyboard,
} from '../../ui';

@Injectable()
export class PlatformIosCommand extends BaseAction {
  readonly pattern = ACTIONS.PLATFORM_IOS;

  constructor() {
    super(PlatformIosCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    const platform = PLATFORM_LINKS.IOS;
    const message = MESSAGES.INSTRUCTIONS_PLATFORM(
      'IOS',
      platform.name,
      platform.url,
    );

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      try {
        await ctx.editMessageText(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      } catch (error) {
        this.logger.warn(`Failed to edit message: ${error}`);
        await ctx.reply(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      }
    } else {
      await ctx.reply(message, {
        reply_markup: platformDetailKeyboard(platform.telegramUrl).reply_markup,
      });
    }
  }
}

@Injectable()
export class PlatformAndroidCommand extends BaseAction {
  readonly pattern = ACTIONS.PLATFORM_ANDROID;

  constructor() {
    super(PlatformAndroidCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    const platform = PLATFORM_LINKS.ANDROID;
    const message = MESSAGES.INSTRUCTIONS_PLATFORM(
      'ANDROID',
      platform.name,
      platform.url,
    );

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      try {
        await ctx.editMessageText(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      } catch (error) {
        this.logger.warn(`Failed to edit message: ${error}`);
        await ctx.reply(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      }
    } else {
      await ctx.reply(message, {
        reply_markup: platformDetailKeyboard(platform.telegramUrl).reply_markup,
      });
    }
  }
}

@Injectable()
export class PlatformWindowsCommand extends BaseAction {
  readonly pattern = ACTIONS.PLATFORM_WINDOWS;

  constructor() {
    super(PlatformWindowsCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    const platform = PLATFORM_LINKS.WINDOWS;
    const message = MESSAGES.INSTRUCTIONS_PLATFORM(
      'WINDOWS',
      platform.name,
      platform.url,
    );

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      try {
        await ctx.editMessageText(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      } catch (error) {
        this.logger.warn(`Failed to edit message: ${error}`);
        await ctx.reply(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      }
    } else {
      await ctx.reply(message, {
        reply_markup: platformDetailKeyboard(platform.telegramUrl).reply_markup,
      });
    }
  }
}

@Injectable()
export class PlatformMacosCommand extends BaseAction {
  readonly pattern = ACTIONS.PLATFORM_MACOS;

  constructor() {
    super(PlatformMacosCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    const platform = PLATFORM_LINKS.MACOS;
    const message = MESSAGES.INSTRUCTIONS_PLATFORM(
      'MACOS',
      platform.name,
      platform.url,
    );

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      try {
        await ctx.editMessageText(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      } catch (error) {
        this.logger.warn(`Failed to edit message: ${error}`);
        await ctx.reply(message, {
          reply_markup: platformDetailKeyboard(platform.telegramUrl)
            .reply_markup,
        });
      }
    } else {
      await ctx.reply(message, {
        reply_markup: platformDetailKeyboard(platform.telegramUrl).reply_markup,
      });
    }
  }
}
