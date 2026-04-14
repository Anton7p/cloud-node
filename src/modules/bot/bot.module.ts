import { Module, Logger, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { RentalsModule } from '../rentals/rentals.module';
import { UsersModule } from '../users/users.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { PaymentModule } from '../payments/payment.module';
import { BotUpdate } from './bot.update';
import { BotActionsService } from './bot-actions.service';
import {
  // CLEAN UI: Новые команды
  StartCommand,
  BuyMenuCommand,
  RentCommand,
  CopyKeyCommand,
  MyKeyCommand,
  MyKeysCommand,
  InstructionsCommand,
  PlatformInstructionsCommand,
  SupportCommand,
  PartnersCommand,
  LegalCommand,
} from './application/commands';
import { BotService } from './bot.service';

/**
 * Все Command handlers, реализующие BaseAction
 * Каждая команда автоматически регистрируется в BotActionsService через Map
 */
const commandHandlers = [
  // CLEAN UI: Новые команды
  StartCommand,
  BuyMenuCommand,
  RentCommand,
  CopyKeyCommand,
  MyKeyCommand,
  MyKeysCommand,
  InstructionsCommand,
  PlatformInstructionsCommand,
  SupportCommand,
  PartnersCommand,
  LegalCommand,
];

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const socksProxy = configService.get<string>('app.socksProxy');
        const token = configService.get<string>('app.telegramBotToken');

        return {
          token,
          options: {
            telegram: {
              agent: socksProxy ? new SocksProxyAgent(socksProxy) : undefined,
            },
          },
          middlewares: [
            async (ctx, next) => {
              const logger = new Logger('Telegraf');
              const user = ctx.from;
              const message = ctx.message || ctx.callbackQuery;

              if (message) {
                logger.log(
                  `Incoming message from user ${user?.id} (@${user?.username || 'unknown'}): ${JSON.stringify(message)}`,
                );
              }

              return next();
            },
          ],
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    UsersModule,
    forwardRef(() => RentalsModule),
    forwardRef(() => IntegrationsModule),
    PaymentModule,
  ],
  providers: [
    // Controller (Infrastructure layer)
    BotUpdate,
    // Orchestrator (Infrastructure layer)
    BotActionsService,
    // Bot API Service for notifications
    BotService,
    // Application Layer: Command Handlers
    ...commandHandlers,
  ],
  exports: [BotService],
})
export class BotModule {}
