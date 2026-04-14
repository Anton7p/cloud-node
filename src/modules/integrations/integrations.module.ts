import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RentalsModule } from '../rentals/rentals.module';
import { RentalActivatedListener } from './listeners/rental-activated.listener';
import { MarzbanModule } from './providers/marzban/marzban.module';
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
  imports: [
    ConfigModule,
    forwardRef(() => RentalsModule),
    QueueModule,
    MarzbanModule,
  ],
  providers: [RentalActivatedListener],
  exports: [forwardRef(() => RentalsModule)],
})
export class IntegrationsModule {}
