import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RentalsModule } from '../rentals/rentals.module';
import { RentalActivatedListener } from './listeners/rental-activated.listener';
import { MarzbanService } from './providers/marzban/marzban.service';
import { QueueModule } from './queue/queue.module';

/**
 * IntegrationsModule - интеграции с внешними сервисами VPN
 *
 * Features:
 * - Обработка событий rental.activated
 * - Управление VPN клиентами через Marzban API
 * - BullMQ очереди для масштабируемости (5000+ users)
 * - Провайдер: MarzbanService
 * - Логирование интеграций
 */
@Module({
  imports: [ConfigModule, RentalsModule, QueueModule],
  providers: [RentalActivatedListener, MarzbanService],
  exports: [MarzbanService],
})
export class IntegrationsModule {}
