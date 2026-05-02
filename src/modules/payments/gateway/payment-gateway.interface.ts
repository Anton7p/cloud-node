import type {
  CreatePaymentParams,
  CreatePaymentResult,
  WebhookEnvelope,
} from './payment-gateway.types';

export interface IPaymentGateway {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  parseWebhook?(
    rawBody: Buffer | string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookEnvelope | null>;
}
