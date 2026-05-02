import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { RentalsModule } from '../rentals/rentals.module';
import { UsersModule } from '../users/users.module';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway.tokens';
import { StubPaymentGateway } from './gateway/stub-payment.gateway';

@Module({
  imports: [ConfigModule, RentalsModule, UsersModule],
  providers: [
    { provide: PAYMENT_GATEWAY, useClass: StubPaymentGateway },
    PaymentService,
  ],
  exports: [PaymentService, PAYMENT_GATEWAY],
})
export class PaymentModule {}
