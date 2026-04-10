import { Logger } from '@nestjs/common';
import {
  IServerProvider,
  ServerRental,
  RentalConfig,
  ComputingSlot,
  TrafficStats,
} from './server-provider.interface';

/**
 * AbstractServerProvider - Base implementation for Server Rental integrations
 * 
 * Provides common functionality shared across all provider implementations:
 * - Logging
 * - Error handling
 * - Connection pooling basics
 * - Retry logic for API calls
 */
export abstract class AbstractServerProvider implements IServerProvider {
  protected readonly logger: Logger;
  protected readonly config: Record<string, unknown>;

  abstract readonly name: string;
  abstract readonly supportedProtocols: string[];

  constructor(providerName: string, config: Record<string, unknown> = {}) {
    this.logger = new Logger(providerName);
    this.config = config;
  }

  /**
   * Health check implementation with logging
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Provision a new Server Rental
   */
  abstract provisionRental(config: RentalConfig): Promise<ServerRental>;

  /**
   * Terminate a Server Rental
   */
  abstract terminateRental(rentalId: string): Promise<boolean>;

  /**
   * Get rental details
   */
  abstract getRental(rentalId: string): Promise<ServerRental | null>;

  /**
   * Allocate a Computing Slot
   */
  abstract allocateSlot(rentalId: string, userId: string): Promise<ComputingSlot>;

  /**
   * Revoke a Computing Slot
   */
  abstract revokeSlot(slotId: string): Promise<boolean>;

  /**
   * Get slot details
   */
  abstract getSlot(slotId: string): Promise<ComputingSlot | null>;

  /**
   * Get traffic statistics for a slot
   */
  abstract getSlotTraffic(slotId: string): Promise<TrafficStats>;

  /**
   * Sync traffic data for all active slots
   */
  abstract syncTrafficData(): Promise<TrafficStats[]>;

  /**
   * Renew rental duration
   */
  abstract renewRental(
    rentalId: string,
    additionalDays: number,
  ): Promise<ServerRental>;

  /**
   * Suspend a rental
   */
  abstract suspendRental(rentalId: string): Promise<boolean>;

  /**
   * Resume a suspended rental
   */
  abstract resumeRental(rentalId: string): Promise<boolean>;

  /**
   * Protected method for retry logic with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`,
        );

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep helper for delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate that requested protocol is supported
   */
  protected validateProtocol(protocol: string): void {
    if (!this.supportedProtocols.includes(protocol)) {
      throw new Error(
        `Protocol '${protocol}' is not supported by ${this.name}. ` +
          `Supported: ${this.supportedProtocols.join(', ')}`,
      );
    }
  }

  /**
   * Generate unique slot ID
   */
  protected generateSlotId(rentalId: string, userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${rentalId}-${userId}-${timestamp}-${random}`;
  }

  /**
   * Generate connection URL for various protocols
   */
  protected generateConnectionUrl(
    protocol: string,
    host: string,
    port: number,
    accessKey: string,
    params?: Record<string, string>,
  ): string {
    const baseUrl = `${protocol}://${accessKey}@${host}:${port}`;
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const queryParams = new URLSearchParams(params).toString();
    return `${baseUrl}?${queryParams}`;
  }
}
