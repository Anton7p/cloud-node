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
  marzbanUrl: string | undefined;
  marzbanAdminUsername: string | undefined;
  marzbanAdminPassword: string | undefined;
  subBaseUrl: string | undefined;
  // SSL / Certbot
  acmeEmail: string | undefined;
  // Encryption
  encryptionKey: string | undefined;
  // Infrastructure nodes
  infrastructureIpList: string | undefined;
  // Marzban Node SSL certificate directory
  marzbanNodeCertDir: string | undefined;
}

const logger = new Logger('Config');

export const configuration = registerAs('app', (): AppConfig => {
  const redisHostValue = process.env.REDIS_HOST?.trim();
  if (!redisHostValue) {
    logger.warn('REDIS_HOST is not set or empty. Using default: redis');
  }

  return {
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
    marzbanUrl: process.env.MARZBAN_URL,
    marzbanAdminUsername: process.env.MARZBAN_ADMIN_USERNAME,
    marzbanAdminPassword: process.env.MARZBAN_ADMIN_PASSWORD,
    subBaseUrl: process.env.SUB_BASE_URL,
    // SSL / Certbot
    acmeEmail: process.env.ACME_EMAIL,
    // Encryption
    encryptionKey: process.env.ENCRYPTION_KEY,
    // Infrastructure nodes
    infrastructureIpList: process.env.INFRASTRUCTURE_IP_LIST,
    // Marzban Node SSL certificate directory
    marzbanNodeCertDir: process.env.MARZBAN_NODE_CERT_DIR,
  };
});

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
  REDIS_PASSWORD: Joi.string().optional(),
  // Marzban configuration - optional, warns only
  MARZBAN_URL: Joi.string().uri().optional(),
  MARZBAN_ADMIN_USERNAME: Joi.string().optional(),
  MARZBAN_ADMIN_PASSWORD: Joi.string().optional(),
  SUB_BASE_URL: Joi.string().uri().optional(),
  // SSL / Certbot email for Let's Encrypt - optional
  ACME_EMAIL: Joi.string().email().optional(),
  // Encryption key - optional
  ENCRYPTION_KEY: Joi.string().optional(),
  // Infrastructure IP list - optional
  INFRASTRUCTURE_IP_LIST: Joi.string().optional(),
  // Marzban Node SSL certificate directory - optional
  MARZBAN_NODE_CERT_DIR: Joi.string().optional(),
});
