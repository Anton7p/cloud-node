import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { BotService } from '../bot.service';

export interface RentalExpiringSoonPayload {
  rentalId: number;
  telegramId: number;
  endDate: string;
}

/**
 * Отправляет напоминание о скором окончании подписки и ставит lastNotifiedAt при успехе.
 */
@Injectable()
export class ExpiringRentalListener {
  private readonly logger = new Logger(ExpiringRentalListener.name);

  constructor(
    private readonly botService: BotService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('rental.expiringSoon')
  async handle(payload: RentalExpiringSoonPayload): Promise<void> {
    const { rentalId, telegramId, endDate } = payload;
    const end = new Date(endDate);

    try {
      await this.botService.notifySubscriptionExpiringSoon(telegramId, end);
      await this.prisma.rental.update({
        where: { id: rentalId },
        data: { lastNotifiedAt: new Date() },
      });
      this.logger.log(
        `Expiring-soon notification sent for rental ${rentalId}, user ${telegramId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Expiring-soon notification failed for rental ${rentalId}, user ${telegramId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
