import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { RentalsModule } from '../rentals/rentals.module';

/**
 * PaymentModule - модуль платежной системы (заглушка)
 *
 * Features:
 * - Интеграция с RentalsModule для проверки триала
 * - Заглушки для платежных методов
 * - Конфигурация через ConfigModule
 */
@Module({
  imports: [ConfigModule, RentalsModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
