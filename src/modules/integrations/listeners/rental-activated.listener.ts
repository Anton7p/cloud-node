import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RentalsService } from '../../rentals/rentals.service';
import { ProvisioningQueue } from '../queue/provisioning.queue';

/**
 * Payload события rental.activated
 */
export interface RentalActivatedPayload {
  rentalId: number;
  userId: number;
  telegramId: number;
  term: number;
  endDate: Date | null;
  chatId: number;
  messageId: number;
}

/**
 * RentalActivatedListener - обработка активации VPN аренды
 *
 * Добавляет задачу создания пользователя в очередь BullMQ
 * для надежной доставки при высокой нагрузке (5000+ users)
 */
@Injectable()
export class RentalActivatedListener {
  private readonly logger = new Logger(RentalActivatedListener.name);

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly provisioningQueue: ProvisioningQueue,
  ) {}

  @OnEvent('rental.activated')
  async handleRentalActivated(payload: RentalActivatedPayload): Promise<void> {
    const { rentalId, telegramId, term, chatId, messageId } = payload;

    this.logger.log(
      `Queueing VPN provisioning for user ${telegramId}, rental ${rentalId}, term ${term} months`,
    );

    try {
      // Add provisioning job to BullMQ queue
      // This allows handling 5000+ users with automatic retries
      await this.provisioningQueue.addProvisioningJob(
        rentalId,
        telegramId.toString(),
        term,
        chatId,
        messageId,
      );

      this.logger.log(`Provisioning job queued for rental ${rentalId}`);
    } catch (error) {
      this.logger.error(
        'Error queueing provisioning job:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      // Fallback: create temporary key immediately
      const tempKey = this.generateTempKey(rentalId, telegramId);
      await this.rentalsService.updateAccessKey(rentalId, tempKey);
    }
  }

  /**
   * Generate temporary key (fallback)
   */
  private generateTempKey(rentalId: number, telegramId: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userHash = telegramId.toString(36).substring(0, 4).toUpperCase();

    return `TEMP-${userHash}-${timestamp}-${random}`;
  }
}
