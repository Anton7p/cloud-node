import { Logger } from '@nestjs/common';
import { BotContext } from '../types/bot.types';

/**
 * Контекст выполнения команды
 */
export interface CommandContext {
  ctx: BotContext;
  userId: number;
  data: string;
  /**
   * Параметры, извлечённые из callback data
   * Например: rent_3m → args = ['3']
   */
  args: string[];
}

/**
 * Абстрактный базовый класс для всех Action команд
 *
 * Паттерн Command/Handler:
 * - Каждая команда сама решает, может ли она обработать данные
 * - Каждая команда сама парсит аргументы из callback строки
 * - Универсальный роутер просто вызывает canHandle → execute
 */
export abstract class BaseAction {
  protected readonly logger: Logger;

  /**
   * Паттерн для matching callback data
   * Может быть:
   * - Точная строка: 'profile'
   * - Регулярное выражение: /^rent_(\d+)m$/
   * - Массив строк: ['help', 'about']
   */
  abstract readonly pattern: string | RegExp | string[];

  constructor(className: string) {
    this.logger = new Logger(className);
  }

  /**
   * Проверяет, может ли эта команда обработать данные
   */
  canHandle(data: string): boolean {
    if (Array.isArray(this.pattern)) {
      return this.pattern.includes(data);
    }
    if (this.pattern instanceof RegExp) {
      return this.pattern.test(data);
    }
    return this.pattern === data;
  }

  /**
   * Извлекает аргументы из callback data
   */
  parseArgs(data: string): string[] {
    if (this.pattern instanceof RegExp) {
      const match = data.match(this.pattern);
      if (match) {
        // Возвращаем capture groups (без полного match)
        return match.slice(1);
      }
    }
    return [];
  }

  /**
   * Основной метод выполнения команды
   */
  abstract execute(context: CommandContext): Promise<void>;

  /**
   * Валидация доступа (заглушка для проверки банов/прав)
   * Переопределите в наследниках для реальной проверки
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validate(_context: CommandContext): Promise<boolean> {
    return true; // Заезд для проверки банов или прав доступа
  }

  /**
   * Вспомогательный метод для логирования
   */
  protected logExecution(data: string, userId: number): void {
    this.logger.log(
      `Executing ${this.constructor.name} for user ${userId} with data: ${data}`,
    );
  }
}

/**
 * Factory для создания контекста команды
 */
export function createCommandContext(
  ctx: BotContext,
  userId: number,
  data: string,
  handler: BaseAction,
): CommandContext {
  return {
    ctx,
    userId,
    data,
    args: handler.parseArgs(data),
  };
}
