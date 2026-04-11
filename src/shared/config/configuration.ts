import { Logger } from '@nestjs/common';
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
  redisPassword: string | undefined;
  // Marzban API
  marzbanBaseUrl: string | undefined;
  marzbanUsername: string | undefined;
  marzbanPassword: string | undefined;
  subBaseUrl: string | undefined;
  // SSL / Certbot
  acmeEmail: string | undefined;
  // Encryption
  encryptionKey: string | undefined;
}

const logger = new Logger('Config');

export const configuration = registerAs(
  'app',
  (): AppConfig => {
    const redisHostValue = process.env.REDIS_HOST?.trim();
    if (!redisHostValue) {
      logger.warn('REDIS_HOST is not set or empty. Using default: redis');
    }

    return ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    socksProxy: process.env.SOCKS_PROXY,
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    databaseUrl: process.env.DATABASE_URL,
    // Redis - use default 'redis' for Docker, fallback to 'localhost' for local dev
    redisHost: process.env.REDIS_HOST?.trim() || 'redis',
    redisPort: parseInt(process.env.REDIS_PORT, 10) || 6379,
    redisPassword: process.env.REDIS_PASSWORD,
    // Marzban API
    marzbanBaseUrl: process.env.MARZBAN_BASE_URL,
    marzbanUsername: process.env.MARZBAN_USERNAME,
    marzbanPassword: process.env.MARZBAN_PASSWORD,
    subBaseUrl: process.env.SUB_BASE_URL,
    // SSL / Certbot
    acmeEmail: process.env.ACME_EMAIL,
    // Encryption
    encryptionKey: process.env.ENCRYPTION_KEY,
  });
  },
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
  // Redis configuration - allow empty string to trigger warning instead of crash
  REDIS_HOST: Joi.string().allow('').default('redis'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required':
        'REDIS_PASSWORD is required in production. Please set a secure Redis password.',
    }),
    otherwise: Joi.optional(),
  }),
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
  // SSL / Certbot email for Let's Encrypt
  ACME_EMAIL: Joi.string()
    .email()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required().messages({
        'any.required':
          'ACME_EMAIL is required in production for SSL certificates.',
      }),
      otherwise: Joi.optional(),
    }),
  // Encryption key (32 bytes required, will be hashed to 32 bytes)
  ENCRYPTION_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required':
        'ENCRYPTION_KEY is required in production for data security.',
    }),
    otherwise: Joi.optional(),
  }),
});
