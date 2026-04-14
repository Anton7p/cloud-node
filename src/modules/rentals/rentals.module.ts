import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { EncryptionModule } from '../../shared/encryption/encryption.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { RentalsService } from './rentals.service';
import { RentalsRepository } from './repositories/rentals.repository';
import { RentalsSchedulerService } from './rentals-scheduler.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    EncryptionModule,
    forwardRef(() => IntegrationsModule),
    ScheduleModule.forRoot(),
  ],
  providers: [RentalsService, RentalsRepository, RentalsSchedulerService],
  exports: [RentalsService, RentalsRepository],
})
export class RentalsModule {}
