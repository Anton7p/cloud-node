import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RentalsModule } from '../rentals/rentals.module';
import { RentalActivatedListener } from './listeners/rental-activated.listener';
import { XuiApiService } from './providers/xui/xui-api.service';

/**
 * IntegrationsModule - интеграции с внешними сервисами VPN
 *
 * Features:
 * - Обработка событий rental.activated
 * - Управление VPN клиентами через 3X-UI API
 * - Провайдер: XuiApiService
 * - Логирование интеграций
 */
@Module({
  imports: [ConfigModule, RentalsModule],
  providers: [RentalActivatedListener, XuiApiService],
  exports: [XuiApiService],
})
export class IntegrationsModule {}
