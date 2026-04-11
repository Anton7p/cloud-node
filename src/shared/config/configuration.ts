import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  telegramBotToken: string;
  socksProxy: string | undefined;
  healthCheckEnabled: boolean;
  databaseUrl: string;
  // Redis
  redisHost: string;
  redisPort: number;
  // Marzban API
  marzbanBaseUrl: string | undefined;
  marzbanUsername: string | undefined;
  marzbanPassword: string | undefined;
  subBaseUrl: string | undefined;
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
    // Redis
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT, 10) || 6379,
    // Marzban API
    marzbanBaseUrl: process.env.MARZBAN_BASE_URL,
    marzbanUsername: process.env.MARZBAN_USERNAME,
    marzbanPassword: process.env.MARZBAN_PASSWORD,
    subBaseUrl: process.env.SUB_BASE_URL,
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
  // Redis configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  // Marzban configuration - required in production
  MARZBAN_BASE_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required().messages({
        'any.required':
          'MARZBAN_BASE_URL is required in production. Please set your Marzban panel URL.',
      }),
      otherwise: Joi.optional(),
    }),
  MARZBAN_USERNAME: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required':
        'MARZBAN_USERNAME is required in production. Please set your Marzban admin username.',
    }),
    otherwise: Joi.optional(),
  }),
  MARZBAN_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required':
        'MARZBAN_PASSWORD is required in production. Please set your Marzban admin password.',
    }),
    otherwise: Joi.optional(),
  }),
  SUB_BASE_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required().messages({
        'any.required':
          'SUB_BASE_URL is required in production. Please set your subscription base URL.',
      }),
      otherwise: Joi.optional(),
    }),
});
