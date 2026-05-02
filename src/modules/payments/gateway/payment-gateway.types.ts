export type NormalizedPaymentStatus =
  | 'AWAITING_PAYMENT'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED'
  | 'REFUNDED'
  | 'DISPUTED';

export type PaymentWebhookEventType = 'PAYMENT_STATUS_CHANGED' | 'REFUND';

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  description?: string;
  externalReference?: string;
  customerReference?: string;
  metadata?: Record<string, string>;
  successReturnUrl?: string;
  failureReturnUrl?: string;
}

export type PaymentInstruction =
  | { kind: 'REDIRECT'; redirectUrl: string }
  | { kind: 'QR'; payload?: string; imageUrl?: string }
  | { kind: 'NONE' };

export interface CreatePaymentResult {
  providerPaymentId: string;
  status: NormalizedPaymentStatus;
  instruction?: PaymentInstruction;
  expiresAt?: Date;
  amount: MoneyAmount;
}

export interface WebhookEnvelope {
  providerPaymentId: string;
  eventType: PaymentWebhookEventType;
  status: NormalizedPaymentStatus;
  amount: MoneyAmount;
  externalReference?: string;
  occurredAt?: Date;
}
