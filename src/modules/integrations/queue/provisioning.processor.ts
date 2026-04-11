import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MarzbanService } from '../providers/marzban/marzban.service';
import { RentalsService } from '../../rentals/rentals.service';

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
    private readonly marzbanService: MarzbanService,
    private readonly rentalsService: RentalsService,
  ) {
    super();
  }

  async process(job: Job<ProvisioningJobData>): Promise<void> {
    const { rentalId, telegramId, months } = job.data;

    this.logger.log(
      `Processing provisioning job ${job.id} for rental ${rentalId}, user ${telegramId}`,
    );

    try {
      // Create user in Marzban
      const result = await this.marzbanService.createUser(telegramId, months);

      if (!result.success || !result.subscriptionUrl) {
        throw new Error(result.error || 'Failed to create Marzban user');
      }

      // Update rental with subscription URL
      await this.rentalsService.updateAccessKey(
        rentalId,
        result.subscriptionUrl,
      );

      this.logger.log(
        `Successfully provisioned rental ${rentalId} with subscription URL`,
      );
    } catch (error) {
      this.logger.error(
        `Provisioning failed for rental ${rentalId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
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
