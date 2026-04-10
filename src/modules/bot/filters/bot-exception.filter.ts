import { Catch, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Context } from 'telegraf';

/**
 * BotExceptionFilter - перехватчик ошибок в обработчиках бота
 *
 * Цель: Вместо "молчания" бота при ошибке, отправляем вежливое сообщение пользователю
 */
@Catch()
export class BotExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BotExceptionFilter.name);

  private readonly ERROR_MESSAGES = {
    DEFAULT: '⚠️ *Произошла небольшая ошибка*\n\nМы уже работаем над её устранением. Попробуйте позже или обратитесь в поддержку.',
    DATABASE: '⚠️ *Проблема с базой данных*\n\nНе удалось сохранить данные. Пожалуйста, попробуйте через минуту.',
    NETWORK: '⚠️ *Проблема со связью*\n\nНе удалось связаться с сервером. Попробуйте позже.',
    VALIDATION: '⚠️ *Некорректные данные*\n\nПроверьте ввод и попробуйте снова.',
  };

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const ctx = host.getArgByIndex<Context>(0);
    const userId = ctx?.from?.id ?? 'unknown';

    // Логируем ошибку с контекстом
    this.logger.error(
      `Exception for user ${userId}: ${exception.message}`,
      exception.stack,
    );

    // Определяем тип ошибки и выбираем сообщение
    const message = this.getErrorMessage(exception);

    // Отправляем вежливое сообщение пользователю
    try {
      if (ctx && 'reply' in ctx) {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
        });
      }
    } catch (replyError) {
      this.logger.error(
        `Failed to send error message to user ${userId}: ${replyError instanceof Error ? replyError.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Определяет тип ошибки и возвращает соответствующее сообщение
   */
  private getErrorMessage(exception: Error): string {
    const message = exception.message.toLowerCase();

    // Ошибки базы данных
    if (message.includes('prisma') || message.includes('database') || message.includes('sql')) {
      return this.ERROR_MESSAGES.DATABASE;
    }

    // Сетевые ошибки
    if (message.includes('network') || message.includes('timeout') || message.includes('etimedout')) {
      return this.ERROR_MESSAGES.NETWORK;
    }

    // Ошибки валидации
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return this.ERROR_MESSAGES.VALIDATION;
    }

    return this.ERROR_MESSAGES.DEFAULT;
  }
}
