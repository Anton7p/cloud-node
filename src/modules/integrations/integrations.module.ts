import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RentalsModule } from '../rentals/rentals.module';
import { RentalActivatedListener } from './listeners/rental-activated.listener';

/**
 * IntegrationsModule - интеграции с внешними сервисами
 *
 * Features:
 * - Обработка событий rental.activated
 * - Выдача Access Keys
 * - Логирование интеграций
 */
@Module({
  imports: [ConfigModule, RentalsModule],
  providers: [RentalActivatedListener],
  exports: [],
})
export class IntegrationsModule {}
