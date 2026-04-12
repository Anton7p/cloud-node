import { Injectable } from '@nestjs/common';
import { RentalsService } from '../../../rentals/rentals.service';
import { MarzbanService } from '../../../integrations/providers/marzban/marzban.service';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import {
  MESSAGES,
  ACCESS_PRICES,
  keyDisplayKeyboard,
  extendSuccessKeyboard,
} from '../../ui';

/**
 * Обработка покупки/продления подписки
 * Универсальная функция для всех тарифов
 */
export async function handleRental(
  ctx: CommandContext['ctx'],
  rentalsService: RentalsService,
  marzbanService: MarzbanService,
  userId: number,
  months: number,
): Promise<void> {
  const price = ACCESS_PRICES.find((p) => p.months === months);
  if (!price) {
    await ctx.reply(MESSAGES.ERROR);
    return;
  }

  const hadActiveRental = await rentalsService.hasActiveRental(userId);
  await rentalsService.createPendingRental(userId, months);

  const rental = await rentalsService.activateRental(userId);
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

  const result = await marzbanService.createUser(String(userId), months);
  if (!result.success || !result.subscriptionUrl) {
    await ctx.reply(MESSAGES.ERROR);
    return;
  }

  await rentalsService.updateAccessKey(rental.id, result.subscriptionUrl);
  await ctx.reply(MESSAGES.KEY_READY(price.label, result.subscriptionUrl), {
    parse_mode: 'Markdown',
    reply_markup: keyDisplayKeyboard(result.subscriptionUrl).reply_markup,
  });
}

/**
 * Универсальная команда для тарифов
 * Pattern: /^month_(\d+)$/ или специальные cases (week, free)
 */
@Injectable()
export class RentCommand extends BaseAction {
  // Обрабатывает: month_1, month_3, month_6, week, free_test
  readonly pattern = /^month_(\d+)$|^week$|^free_test$/;

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly marzbanService: MarzbanService,
  ) {
    super(RentCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    await safeDeleteMessage(ctx);

    // Parse months from pattern
    let months = 0;
    if (data === 'week') {
      months = 0.25;
    } else if (data === 'free_test') {
      months = 0;
    } else if (data.startsWith('month_')) {
      months = parseInt(data.replace('month_', ''), 10);
    }

    await handleRental(
      ctx,
      this.rentalsService,
      this.marzbanService,
      userId,
      months,
    );
  }
}
