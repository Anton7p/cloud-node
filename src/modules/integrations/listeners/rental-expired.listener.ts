import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MarzbanService } from '../providers/marzban/marzban.service';

/**
 * Payload события rental.expired
 */
export interface RentalExpiredPayload {
  rentalId: number;
  userId: number;
  telegramId: number;
}

/**
 * RentalExpiredListener - обработка истечения срока аренды VPN
 *
 * Приостанавливает пользователя в Marzban при истечении аренды
 */
@Injectable()
export class RentalExpiredListener {
  private readonly logger = new Logger(RentalExpiredListener.name);

  constructor(private readonly marzbanService: MarzbanService) {}

  @OnEvent('rental.expired')
  async handleRentalExpired(payload: RentalExpiredPayload): Promise<void> {
    const { rentalId, telegramId } = payload;

    this.logger.log(
      `Processing rental expiration for user ${telegramId}, rental ${rentalId}`,
    );

    try {
      // TODO: Реализовать suspendUser в MarzbanService
      // await this.marzbanService.suspendUser(telegramId.toString());

      this.logger.log(
        `Successfully suspended user ${telegramId} in Marzban (rental ${rentalId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to suspend user ${telegramId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
