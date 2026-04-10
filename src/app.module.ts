import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TerminusModule } from '@nestjs/terminus';
import { configuration, validationSchema } from './shared/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { BotModule } from './modules/bot/bot.module';
import { UsersModule } from './modules/users/users.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { HealthController } from './shared/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    PrismaModule,
    TerminusModule,
    EventEmitterModule.forRoot(),
    UsersModule,
    RentalsModule,
    IntegrationsModule,
    BotModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
