import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RentalsModule } from '../rentals/rentals.module';
import { RentalActivatedListener } from './listeners/rental-activated.listener';
import { VlessProvider } from './providers/vless/vless.provider';
import { ShadowsocksProvider } from './providers/shadowsocks/shadowsocks.provider';

/**
 * IntegrationsModule - интеграции с внешними сервисами Server Rental
 *
 * Features:
 * - Обработка событий rental.activated
 * - Управление Server Rentals и Computing Slots
 * - Провайдеры: VLESS, Shadowsocks
 * - Логирование интеграций
 */
@Module({
  imports: [ConfigModule, RentalsModule],
  providers: [RentalActivatedListener, VlessProvider, ShadowsocksProvider],
  exports: [VlessProvider, ShadowsocksProvider],
})
export class IntegrationsModule {}
