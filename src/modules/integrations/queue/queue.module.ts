import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ProvisioningQueue } from './provisioning.queue';
import { ProvisioningProcessor } from './provisioning.processor';
import { MarzbanService } from '../providers/marzban/marzban.service';
import { RentalsModule } from '../../rentals/rentals.module';
import { AppConfig } from '../../../shared/config/configuration';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<AppConfig['redisHost']>('app.redisHost');
        const redisPort = configService.get<AppConfig['redisPort']>('app.redisPort');

        return {
          connection: {
            host: redisHost || 'localhost',
            port: redisPort || 6379,
          },
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'provisioning',
    }),
    RentalsModule,
  ],
  providers: [ProvisioningQueue, ProvisioningProcessor, MarzbanService],
  exports: [ProvisioningQueue, MarzbanService],
})
export class QueueModule {}
