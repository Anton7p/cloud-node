import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../shared/config/configuration';

interface SubscriptionSuccessPayload {
  chatId: number;
  subscriptionUrl: string;
  rentalId: number;
  telegramId: string;
}

interface SubscriptionFailedPayload {
  chatId: number;
  error: string;
  rentalId: number;
  telegramId: string;
}

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly bot: Telegraf;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<AppConfig['telegramBotToken']>(
      'app.telegramBotToken',
    );
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    this.bot = new Telegraf(token);
  }

  /**
   * Send a message to a specific chat
   */
  async sendMessage(chatId: number, text: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
      });
      this.logger.log(`Message sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send message to chat ${chatId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  /**
   * Edit an existing message
   */
  async editMessage(
    chatId: number,
    messageId: number,
    text: string,
  ): Promise<void> {
    try {
      await this.bot.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        text,
        {
          parse_mode: 'HTML',
        },
      );
      this.logger.log(`Message ${messageId} edited in chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to edit message ${messageId} in chat ${chatId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  /**
   * Notify user about successful subscription activation
   */
  async notifySubscriptionSuccess(
    chatId: number,
    subscriptionUrl: string,
  ): Promise<void> {
    const message = `
✅ <b>Подписка успешно активирована!</b>

Ваш ключ доступа:
<code>${subscriptionUrl}</code>

Нажмите на ключ, чтобы скопировать его.
    `.trim();

    await this.sendMessage(chatId, message);
  }

  /**
   * Notify user about subscription activation failure
   */
  async notifySubscriptionFailed(
    chatId: number,
    errorMessage: string,
  ): Promise<void> {
    const message = `
❌ <b>Ошибка активации подписки</b>

К сожалению, не удалось создать подписку.
Ошибка: ${errorMessage}

Пожалуйста, обратитесь в поддержку.
    `.trim();

    await this.sendMessage(chatId, message);
  }

  /**
   * Handle subscription success event from queue
   */
  @OnEvent('subscription.success')
  async handleSubscriptionSuccess(
    payload: SubscriptionSuccessPayload,
  ): Promise<void> {
    const { chatId, subscriptionUrl, rentalId, telegramId } = payload;
    this.logger.log(
      `Handling subscription.success event for rental ${rentalId}, user ${telegramId}`,
    );
    try {
      await this.notifySubscriptionSuccess(chatId, subscriptionUrl);
    } catch (error) {
      this.logger.error(
        `Failed to notify user ${telegramId} about subscription success:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Handle subscription failed event from queue
   */
  @OnEvent('subscription.failed')
  async handleSubscriptionFailed(
    payload: SubscriptionFailedPayload,
  ): Promise<void> {
    const { chatId, error, rentalId, telegramId } = payload;
    this.logger.log(
      `Handling subscription.failed event for rental ${rentalId}, user ${telegramId}`,
    );
    try {
      await this.notifySubscriptionFailed(chatId, error);
    } catch (err) {
      this.logger.error(
        `Failed to notify user ${telegramId} about subscription failure:`,
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }
}
