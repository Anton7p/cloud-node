import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VPN_PANEL_ADAPTER } from '../vpn-panel/vpn-panel.tokens';
import type { IVpnPanelAdapter } from '../vpn-panel/vpn-panel.interface';

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
 * Приостанавливает пользователя на VPN-панели при истечении аренды
 */
@Injectable()
export class RentalExpiredListener {
  private readonly logger = new Logger(RentalExpiredListener.name);

  constructor(
    @Inject(VPN_PANEL_ADAPTER)
    private readonly vpnPanel: IVpnPanelAdapter,
  ) {}

  @OnEvent('rental.expired')
  async handleRentalExpired(payload: RentalExpiredPayload): Promise<void> {
    const { rentalId, telegramId } = payload;

    this.logger.log(
      `Processing rental expiration for user ${telegramId}, rental ${rentalId}`,
    );

    try {
      const ok = await this.vpnPanel.suspendUser(String(telegramId));
      if (ok) {
        this.logger.log(
          `Suspended user ${telegramId} on VPN panel (rental ${rentalId})`,
        );
      } else {
        this.logger.warn(
          `suspendUser returned false for ${telegramId} (rental ${rentalId})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to suspend user ${telegramId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
