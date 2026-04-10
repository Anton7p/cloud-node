import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RentalsService } from '../../rentals/rentals.service';

/**
 * Payload события rental.activated
 */
export interface RentalActivatedPayload {
  rentalId: number;
  userId: number;
  telegramId: number;
  term: number;
  endDate: Date | null;
}

/**
 * RentalActivatedListener - обработка активации аренды сервера
 *
 * Имитирует выдачу Access Key и запись в БД
 */
@Injectable()
export class RentalActivatedListener {
  private readonly logger = new Logger(RentalActivatedListener.name);

  constructor(private readonly rentalsService: RentalsService) {}

  @OnEvent('rental.activated')
  async handleRentalActivated(payload: RentalActivatedPayload): Promise<void> {
    const { rentalId, telegramId, term } = payload;

    this.logger.log(
      `Processing server slot activation for user ${telegramId}, rental ${rentalId}, term ${term} months`
    );

    // Имитация генерации Access Key
    const accessKey = this.generateAccessKey(rentalId, telegramId);

    // Сохраняем Access Key в аренду
    await this.rentalsService.updateAccessKey(rentalId, accessKey);

    this.logger.log(
      `Access Key issued for rental ${rentalId}: ${accessKey.substring(0, 8)}...`
    );
  }

  /**
   * Генерация уникального Access Key
   */
  private generateAccessKey(rentalId: number, telegramId: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userHash = telegramId.toString(36).substring(0, 4).toUpperCase();

    return `AK-${userHash}-${timestamp}-${random}`;
  }
}
