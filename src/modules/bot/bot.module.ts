import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { RentalsModule } from '../rentals/rentals.module';
import { UsersModule } from '../users/users.module';
import { BotUpdate } from './bot.update';
import { BotActionsService } from './bot-actions.service';
import {
  StartCommand,
  ProfileCommand,
  RentServerCommand,
  RentTermCommand,
  PayRentalCommand,
  GetAccessCommand,
  InstructionsCommand,
  PlatformInstructionCommand,
  ReferralCommand,
  HelpCommand,
} from './application/commands';

/**
 * Все Command handlers, реализующие BaseAction
 * Каждая команда автоматически регистрируется в BotActionsService через Map
 */
const commandHandlers = [
  StartCommand,
  ProfileCommand,
  RentServerCommand,
  RentTermCommand,
  PayRentalCommand,
  GetAccessCommand,
  InstructionsCommand,
  PlatformInstructionCommand,
  ReferralCommand,
  HelpCommand,
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
    RentalsModule,
  ],
  providers: [
    // Controller (Infrastructure layer)
    BotUpdate,
    // Orchestrator (Infrastructure layer)
    BotActionsService,
    // Application Layer: Command Handlers
    ...commandHandlers,
  ],
})
export class BotModule {}
