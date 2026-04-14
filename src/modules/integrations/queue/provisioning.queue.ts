import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export interface ProvisioningJobData {
  rentalId: number;
  telegramId: string;
  months: number;
  chatId: number;
  messageId: number;
}

@Injectable()
export class ProvisioningQueue {
  private readonly logger = new Logger(ProvisioningQueue.name);

  constructor(
    @InjectQueue('provisioning')
    private readonly queue: Queue<ProvisioningJobData>,
  ) {}

  /**
   * Add a provisioning job to the queue
   * Retries every 30 seconds if failed
   */
  async addProvisioningJob(
    rentalId: number,
    telegramId: string,
    months: number,
    chatId: number,
    messageId: number,
  ): Promise<void> {
    await this.queue.add(
      'provision-user',
      {
        rentalId,
        telegramId,
        months,
        chatId,
        messageId,
      },
      {
        jobId: `provisioning-${rentalId}`,
        attempts: 10,
        backoff: {
          type: 'exponential',
          delay: 5000, // Initial delay: 5 seconds
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(
      `Added provisioning job for rental ${rentalId}, user ${telegramId}`,
    );
  }
}
