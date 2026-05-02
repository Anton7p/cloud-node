import { Inject, Injectable } from '@nestjs/common';
import { RentalsService } from '../../../rentals/rentals.service';
import { VPN_PANEL_ADAPTER } from '../../../integrations/vpn-panel/vpn-panel.tokens';
import type { IVpnPanelAdapter } from '../../../integrations/vpn-panel/vpn-panel.interface';
import { PaymentService } from '../../../payments/payment.service';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import {
  MESSAGES,
  ACCESS_PRICES,
  keyDisplayKeyboard,
  extendSuccessKeyboard,
  mainKeyboard,
} from '../../ui';

/**
 * Обработка покупки/продления подписки
 * Универсальная функция для всех тарифов
 */
export async function handleRental(
  ctx: CommandContext['ctx'],
  rentalsService: RentalsService,
  vpnPanel: IVpnPanelAdapter,
  paymentService: PaymentService,
  userId: number,
  months: number,
  data: string,
): Promise<void> {
  // Handle free trial (free_test or months = 0)
  if (data === 'free_test' || months === 0) {
    const result = await paymentService.createTrialRental(userId);

    if (!result.success) {
      await ctx.reply(result.message || MESSAGES.ERROR, {
        reply_markup: mainKeyboard().reply_markup,
      });
      return;
    }

    const provision = await vpnPanel.provisionUser(String(userId), months);
    if (!provision.success || !provision.subscriptionUrl) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Update rental with subscription URL
    if (result.rentalId) {
      await rentalsService.updateAccessKey(
        result.rentalId,
        provision.subscriptionUrl,
      );
    }

    await ctx.reply(
      MESSAGES.KEY_READY('3 дня бесплатно', provision.subscriptionUrl),
      {
        parse_mode: 'Markdown',
        reply_markup: keyDisplayKeyboard(provision.subscriptionUrl)
          .reply_markup,
      },
    );
    return;
  }

  // Платные тарифы: шлюз (сейчас заглушка с мгновенным успехом) → аренда → VPN при необходимости
  if (data === 'week' || data.startsWith('month_')) {
    let result;
    if (data === 'week') {
      result = await paymentService.processWeekPayment(userId);
    } else {
      const monthsCount = parseInt(data.replace('month_', ''), 10);
      result = await paymentService.processMonthPayment(userId, monthsCount);
    }

    if (!result.success) {
      await ctx.reply(result.message || MESSAGES.ERROR, {
        reply_markup: mainKeyboard().reply_markup,
      });
      return;
    }

    if (
      result.isExtension &&
      result.extendEndDateLabel !== undefined &&
      result.extendEndDateLabel !== ''
    ) {
      await ctx.reply(MESSAGES.EXTEND_SUCCESS(result.extendEndDateLabel), {
        reply_markup: extendSuccessKeyboard().reply_markup,
      });
      return;
    }

    if (
      result.needsProvisioning &&
      result.rentalId !== undefined &&
      result.tariffLabel &&
      typeof result.termMonths === 'number'
    ) {
      const provision = await vpnPanel.provisionUser(
        String(userId),
        result.termMonths,
      );
      if (!provision.success || !provision.subscriptionUrl) {
        await ctx.reply(MESSAGES.ERROR);
        return;
      }
      await rentalsService.updateAccessKey(
        result.rentalId,
        provision.subscriptionUrl,
      );
      await ctx.reply(
        MESSAGES.KEY_READY(result.tariffLabel, provision.subscriptionUrl),
        {
          parse_mode: 'Markdown',
          reply_markup: keyDisplayKeyboard(provision.subscriptionUrl)
            .reply_markup,
        },
      );
      return;
    }

    await ctx.reply(result.message || MESSAGES.ERROR, {
      reply_markup: mainKeyboard().reply_markup,
    });
    return;
  }

  // Legacy flow for other cases (should not reach here with new UI)
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

  const result = await vpnPanel.provisionUser(String(userId), months);
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
    @Inject(VPN_PANEL_ADAPTER)
    private readonly vpnPanel: IVpnPanelAdapter,
    private readonly paymentService: PaymentService,
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
      this.vpnPanel,
      this.paymentService,
      userId,
      months,
      data,
    );
  }
}
