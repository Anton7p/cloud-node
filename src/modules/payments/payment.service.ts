import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RentalsService } from '../rentals/rentals.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppConfig } from '../../shared/config/configuration';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway.tokens';
import type { IPaymentGateway } from './gateway/payment-gateway.interface';
import type { NormalizedPaymentStatus } from './gateway/payment-gateway.types';
import { ACCESS_PRICES } from '../bot/ui/templates/clean.templates';

export interface PaymentResult {
  success: boolean;
  message?: string;
  rentalId?: number;
  /** Новая подписка: нужен вызов VPN-панели */
  needsProvisioning?: boolean;
  termMonths?: number;
  tariffLabel?: string;
  /** Продление существующей активной аренды */
  isExtension?: boolean;
  extendEndDateLabel?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  private getTrialConfig() {
    return {
      days:
        this.configService.get<AppConfig['trialDays']>('app.trialDays') || 3,
      ipLimit:
        this.configService.get<AppConfig['trialIpLimit']>('app.trialIpLimit') ||
        2,
    };
  }

  async hasUsedTrial(telegramId: number): Promise<boolean> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) return false;

    const anyRental = await this.prisma.rental.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    return anyRental !== null;
  }

  async createTrialRental(telegramId: number): Promise<PaymentResult> {
    const { days, ipLimit } = this.getTrialConfig();

    try {
      const hasTrial = await this.hasUsedTrial(telegramId);
      if (hasTrial) {
        return {
          success: false,
          message:
            'Вы уже использовали бесплатный период. Выберите платный тариф.',
        };
      }

      const termInMonths = days / 30;

      await this.rentalsService.createPendingRental(telegramId, termInMonths);

      const activatedRental =
        await this.rentalsService.activateRental(telegramId);

      if (!activatedRental) {
        return {
          success: false,
          message:
            'Не удалось активировать бесплатный период. Попробуйте позже.',
        };
      }

      this.logger.log(
        `Created trial rental for user ${telegramId}, rentalId: ${activatedRental.id}, ` +
          `days: ${days}, ipLimit: ${ipLimit}`,
      );

      return {
        success: true,
        rentalId: activatedRental.id,
        message: `Бесплатный период активирован на ${days} дня!`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create trial rental for ${telegramId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return {
        success: false,
        message: 'Ошибка при создании бесплатного периода.',
      };
    }
  }

  async processWeekPayment(telegramId: number): Promise<PaymentResult> {
    return this.processPaidTariff(telegramId, 0.25);
  }

  async processMonthPayment(
    telegramId: number,
    months: number,
  ): Promise<PaymentResult> {
    return this.processPaidTariff(telegramId, months);
  }

  private isPaidSuccess(status: NormalizedPaymentStatus): boolean {
    return status === 'SUCCEEDED';
  }

  /**
   * Создание платежа через шлюз, затем аренда (как только оплата подтверждена).
   */
  private async processPaidTariff(
    telegramId: number,
    termMonths: number,
  ): Promise<PaymentResult> {
    const price = ACCESS_PRICES.find((p) => p.months === termMonths);
    if (!price || price.months === 0) {
      return {
        success: false,
        message: 'Неизвестный тариф. Выберите вариант из меню.',
      };
    }

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      return {
        success: false,
        message: 'Пользователь не найден. Нажмите /start.',
      };
    }

    const externalReference = `user:${user.id}:tariff:${termMonths}`;

    let paymentResult;
    try {
      paymentResult = await this.paymentGateway.createPayment({
        amount: price.price,
        currency: 'RUB',
        description: price.label,
        externalReference,
        customerReference: String(user.id),
        metadata: {
          telegramId: String(telegramId),
          termMonths: String(termMonths),
        },
      });
    } catch (e) {
      this.logger.error(
        `Gateway createPayment failed for tg=${telegramId}:`,
        e instanceof Error ? e.message : e,
      );
      return {
        success: false,
        message: 'Не удалось создать платёж. Попробуйте позже.',
      };
    }

    if (!this.isPaidSuccess(paymentResult.status)) {
      return {
        success: false,
        message: 'Оплата не подтверждена.',
      };
    }

    this.logger.debug(
      `Payment recorded providerId=${paymentResult.providerPaymentId} ` +
        `stub status=${paymentResult.status} tg=${telegramId}`,
    );

    const hadActiveRental =
      await this.rentalsService.hasActiveRental(telegramId);
    await this.rentalsService.createPendingRental(telegramId, termMonths);
    const rental = await this.rentalsService.activateRental(telegramId);

    if (!rental) {
      return {
        success: false,
        message:
          'Не удалось активировать подписку после оплаты. Обратитесь в поддержку.',
      };
    }

    if (hadActiveRental) {
      const endDateLabel = rental.endDate
        ? new Date(rental.endDate).toLocaleDateString('ru-RU')
        : 'неизвестно';
      return {
        success: true,
        rentalId: rental.id,
        isExtension: true,
        extendEndDateLabel: endDateLabel,
        message:
          '[Тестовый режим оплаты] Подписка продлена.' +
          (price.label ? ` Тариф: ${price.label}.` : ''),
      };
    }

    return {
      success: true,
      rentalId: rental.id,
      needsProvisioning: true,
      termMonths,
      tariffLabel: price.label,
      message: '[Тестовый режим оплаты] Условная оплата прошла успешно.',
    };
  }
}
