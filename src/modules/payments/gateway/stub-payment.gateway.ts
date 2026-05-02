import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IPaymentGateway } from './payment-gateway.interface';
import type {
  CreatePaymentParams,
  CreatePaymentResult,
} from './payment-gateway.types';

/**
 * Заглушка шлюза: сразу возвращает SUCCEEDED без внешнего вызова.
 * Замена на реальный адаптер (Platega и т.д.) — через PAYMENT_GATEWAY.
 */
@Injectable()
export class StubPaymentGateway implements IPaymentGateway {
  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    return {
      providerPaymentId: `stub_${randomUUID()}`,
      status: 'SUCCEEDED',
      instruction: { kind: 'NONE' },
      amount: {
        amount: params.amount,
        currency: params.currency,
      },
    };
  }
}
