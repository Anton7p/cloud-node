import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { RentalStatus } from '@prisma/client';
import { VPN_PANEL_ADAPTER } from '../vpn-panel/vpn-panel.tokens';
import type { IVpnPanelAdapter } from '../vpn-panel/vpn-panel.interface';
import { RentalsService } from '../../rentals/rentals.service';
import { RentalsRepository } from '../../rentals/repositories/rentals.repository';

interface ProvisioningJobData {
  rentalId: number;
  telegramId: string;
  months: number;
  chatId: number;
  messageId: number;
}

@Processor('provisioning', {
  concurrency: 5,
})
export class ProvisioningProcessor extends WorkerHost {
  private readonly logger = new Logger(ProvisioningProcessor.name);

  constructor(
    @Inject(VPN_PANEL_ADAPTER)
    private readonly vpnPanel: IVpnPanelAdapter,
    private readonly rentalsService: RentalsService,
    private readonly rentalsRepository: RentalsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<ProvisioningJobData>): Promise<void> {
    const { rentalId, telegramId, months, chatId } = job.data;

    this.logger.log(
      `Processing provisioning job ${job.id} for rental ${rentalId}, user ${telegramId}`,
    );

    try {
      const rental = await this.rentalsRepository.findById(rentalId);
      if (!rental) {
        throw new Error(`Rental ${rentalId} not found`);
      }

      // Idempotent: retries after successful DB write or duplicate job must not re-hit the panel
      if (rental.status === RentalStatus.ACTIVE && rental.accessKey) {
        const existingUrl =
          await this.rentalsService.getDecryptedAccessKey(rental);
        if (existingUrl && !existingUrl.startsWith('TEMP-')) {
          this.logger.log(
            `Rental ${rentalId} already has subscription (job ${String(job.id)}), skipping provisioning`,
          );
          if (chatId) {
            this.eventEmitter.emit('subscription.success', {
              chatId,
              subscriptionUrl: existingUrl,
              rentalId,
              telegramId,
            });
          }
          return;
        }
      }

      const result = await this.vpnPanel.provisionUser(telegramId, months);

      if (!result.success || !result.subscriptionUrl) {
        throw new Error(result.error || 'Failed to provision VPN user');
      }

      await this.rentalsService.updateAccessKey(
        rentalId,
        result.subscriptionUrl,
      );

      this.logger.log(
        `Successfully provisioned rental ${rentalId} with subscription URL`,
      );

      if (chatId) {
        this.eventEmitter.emit('subscription.success', {
          chatId,
          subscriptionUrl: result.subscriptionUrl,
          rentalId,
          telegramId,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Provisioning failed for rental ${rentalId}:`,
        errorMessage,
      );

      // Update rental status to EXPIRED to mark it as failed
      await this.rentalsRepository.updateStatus(rentalId, RentalStatus.EXPIRED);

      // Notify user about failure
      if (chatId) {
        this.eventEmitter.emit('subscription.failed', {
          chatId,
          error: errorMessage,
          rentalId,
          telegramId,
        });
      }

      throw error; // Re-throw to trigger retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ProvisioningJobData>): void {
    this.logger.log(`Provisioning job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ProvisioningJobData>, error: Error): void {
    this.logger.error(
      `Provisioning job ${job.id} failed after ${job.attemptsMade} attempts:`,
      error.message,
    );
  }
}
