import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  telegramBotToken: string;
  socksProxy: string | undefined;
  healthCheckEnabled: boolean;
  databaseUrl: string;
}

export const configuration = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    socksProxy: process.env.SOCKS_PROXY,
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    databaseUrl: process.env.DATABASE_URL,
  }),
);

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .required()
    .uri({
      scheme: ['postgresql', 'postgres'],
    })
    .messages({
      'any.required':
        'DATABASE_URL is required. Please set your PostgreSQL connection string in .env file.',
      'string.uri':
        'DATABASE_URL must be a valid PostgreSQL connection string (postgresql:// or postgres://)',
    }),
  TELEGRAM_BOT_TOKEN: Joi.string().required().messages({
    'any.required':
      'TELEGRAM_BOT_TOKEN is required. Please set your Telegram bot token in .env file.',
  }),
  HEALTH_CHECK_ENABLED: Joi.boolean().default(true),
  SOCKS_PROXY: Joi.string().allow('', null).optional(),
});
