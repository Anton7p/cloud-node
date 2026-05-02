import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RentalsModule } from '../rentals/rentals.module';
import { RentalActivatedListener } from './listeners/rental-activated.listener';
import { RentalExpiredListener } from './listeners/rental-expired.listener';
import { VpnPanelModule } from './vpn-panel';
import { QueueModule } from './queue/queue.module';

/**
 * IntegrationsModule - интеграции с внешними сервисами VPN
 *
 * Features:
 * - Обработка событий rental.activated, rental.expired
 * - VPN: IVpnPanelAdapter (по умолчанию Marzban)
 * - BullMQ очереди для масштабируемости (5000+ users)
 * - Логирование интеграций
 */
@Module({
  imports: [ConfigModule, RentalsModule, QueueModule, VpnPanelModule],
  providers: [RentalActivatedListener, RentalExpiredListener],
  exports: [QueueModule, VpnPanelModule],
})
export class IntegrationsModule {}
