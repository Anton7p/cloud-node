import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RentalsService } from '../../rentals/rentals.service';
import { XuiApiService } from '../providers/xui/xui-api.service';

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
 * RentalActivatedListener - обработка активации VPN аренды
 *
 * Создает клиента в 3X-UI панели и сохраняет ссылку подключения
 */
@Injectable()
export class RentalActivatedListener {
  private readonly logger = new Logger(RentalActivatedListener.name);

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly xuiApiService: XuiApiService,
  ) {}

  @OnEvent('rental.activated')
  async handleRentalActivated(payload: RentalActivatedPayload): Promise<void> {
    const { rentalId, telegramId, term, endDate } = payload;

    this.logger.log(
      `Processing VPN activation for user ${telegramId}, rental ${rentalId}, term ${term} months`,
    );

    try {
      // Получаем список доступных inbounds
      const inbounds = await this.xuiApiService.getInbounds();

      if (inbounds.length === 0) {
        this.logger.error('No available inbounds found in 3X-UI panel');
        // Fallback на временный ключ
        const tempKey = this.generateTempKey(rentalId, telegramId);
        await this.rentalsService.updateAccessKey(rentalId, tempKey);
        return;
      }

      // Выбираем первый доступный inbound (можно добавить логику выбора по нагрузке)
      const selectedInbound = inbounds[0];
      const clientEmail = `user_${telegramId}_${rentalId}`;

      // Рассчитываем дату истечения
      const expireDays = endDate
        ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : term * 30;

      // Создаем клиента в 3X-UI
      const success = await this.xuiApiService.addClient(selectedInbound.id, {
        email: clientEmail,
        limitIp: 2, // Максимум 2 устройства
        expireDays,
        totalGB: 0, // Безлимитный трафик
      });

      if (!success) {
        this.logger.error(`Failed to create client in 3X-UI for rental ${rentalId}`);
        const tempKey = this.generateTempKey(rentalId, telegramId);
        await this.rentalsService.updateAccessKey(rentalId, tempKey);
        return;
      }

      // Получаем ссылку подключения
      const connectionLink = await this.xuiApiService.getClientLink(
        selectedInbound.id,
        clientEmail,
      );

      if (connectionLink) {
        await this.rentalsService.updateAccessKey(rentalId, connectionLink);
        this.logger.log(
          `VPN client created for rental ${rentalId}, inbound ${selectedInbound.id}`,
        );
      } else {
        this.logger.warn(`Failed to get connection link for rental ${rentalId}`);
        const tempKey = this.generateTempKey(rentalId, telegramId);
        await this.rentalsService.updateAccessKey(rentalId, tempKey);
      }
    } catch (error) {
      this.logger.error(
        'Error activating rental:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      // Fallback на временный ключ
      const tempKey = this.generateTempKey(rentalId, telegramId);
      await this.rentalsService.updateAccessKey(rentalId, tempKey);
    }
  }

  /**
   * Генерация временного ключа (fallback)
   */
  private generateTempKey(rentalId: number, telegramId: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userHash = telegramId.toString(36).substring(0, 4).toUpperCase();

    return `TEMP-${userHash}-${timestamp}-${random}`;
  }
}
