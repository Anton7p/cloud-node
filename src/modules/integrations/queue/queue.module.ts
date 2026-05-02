import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ProvisioningQueue } from './provisioning.queue';
import { ProvisioningProcessor } from './provisioning.processor';
import { VpnPanelModule } from '../vpn-panel';
import { RentalsModule } from '../../rentals/rentals.module';
import { AppConfig } from '../../../shared/config/configuration';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisHost =
          configService.get<AppConfig['redisHost']>('app.redisHost');
        const redisPort =
          configService.get<AppConfig['redisPort']>('app.redisPort');
        const redisPassword =
          configService.get<AppConfig['redisPassword']>('app.redisPassword');

        return {
          connection: {
            host: redisHost || 'cloudnode-redis',
            port: redisPort || 6379,
            password: redisPassword,
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
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
    VpnPanelModule,
    RentalsModule,
  ],
  providers: [ProvisioningQueue, ProvisioningProcessor],
  exports: [ProvisioningQueue],
})
export class QueueModule {}
