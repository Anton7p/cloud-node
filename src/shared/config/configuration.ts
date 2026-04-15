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
  // VPN Panel API (Marzban & XUI shared)
  vpnPanelUrl: string | undefined;
  vpnAdminUsername: string | undefined;
  vpnAdminPassword: string | undefined;
  // Domain name for external links
  domainName: string | undefined;
  // SSL / Certbot
  acmeEmail: string | undefined;
  // Encryption
  encryptionKey: string | undefined;
  // Infrastructure nodes
  infrastructureIpList: string | undefined;
  // Marzban Node SSL certificate directory
  marzbanNodeCertDir: string | undefined;
  // Marzban Inbound tag for user creation
  marzbanInboundTag: string | undefined;
  // Reality protocol settings
  realityPublicKey: string | undefined;
  realityShortId: string | undefined;
  // Default data limit for new users (in bytes)
  defaultDataLimit: number;
  // Days per month for subscription calculation
  subscriptionDaysPerMonth: number;
  // Trial configuration
  trialDays: number;
  trialIpLimit: number;
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
    // VPN Panel API (shared for Marzban & XUI)
    vpnPanelUrl: process.env.VPN_PANEL_URL,
    vpnAdminUsername: process.env.VPN_ADMIN_USERNAME,
    vpnAdminPassword: process.env.VPN_ADMIN_PASSWORD,
    // Domain name for external links
    domainName: process.env.DOMAIN_NAME,
    // SSL / Certbot
    acmeEmail: process.env.ACME_EMAIL,
    // Encryption
    encryptionKey: process.env.ENCRYPTION_KEY,
    // Infrastructure nodes
    infrastructureIpList: process.env.INFRASTRUCTURE_IP_LIST,
    // Marzban Node SSL certificate directory
    marzbanNodeCertDir: process.env.MARZBAN_NODE_CERT_DIR,
    // Marzban Inbound tag for user creation (default: VLESS_REALITY)
    marzbanInboundTag: process.env.MARZBAN_INBOUND_TAG || 'VLESS_REALITY',
    // Reality protocol settings
    realityPublicKey: process.env.REALITY_PUBLIC_KEY,
    realityShortId: process.env.REALITY_SHORT_ID || 'abcd1234',
    // Default data limit for new users (100 GB in bytes)
    defaultDataLimit:
      parseInt(process.env.DEFAULT_DATA_LIMIT, 10) || 107374182400,
    // Days per month for subscription calculation
    subscriptionDaysPerMonth:
      parseInt(process.env.SUBSCRIPTION_DAYS_PER_MONTH, 10) || 30,
    // Trial configuration (default: 3 days, 2 IP limit)
    trialDays: parseInt(process.env.TRIAL_DAYS, 10) || 3,
    trialIpLimit: parseInt(process.env.TRIAL_IP_LIMIT, 10) || 2,
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
  REDIS_PASSWORD: Joi.string().allow('', null).optional(),
  // VPN Panel configuration (shared for Marzban & XUI) - optional, warns only
  VPN_PANEL_URL: Joi.string().uri().optional(),
  VPN_ADMIN_USERNAME: Joi.string().optional(),
  VPN_ADMIN_PASSWORD: Joi.string().optional(),
  // Domain name for external links - optional
  DOMAIN_NAME: Joi.string().optional(),
  // SSL / Certbot email for Let's Encrypt - optional
  ACME_EMAIL: Joi.string().email().optional(),
  // Encryption key - optional
  ENCRYPTION_KEY: Joi.string().optional(),
  // Infrastructure IP list - optional
  INFRASTRUCTURE_IP_LIST: Joi.string().optional(),
  // Marzban Node SSL certificate directory - optional
  MARZBAN_NODE_CERT_DIR: Joi.string().optional(),
  // Marzban Inbound tag for user creation - optional, default VLESS_REALITY
  MARZBAN_INBOUND_TAG: Joi.string().optional(),
  // Reality protocol settings - optional
  REALITY_PUBLIC_KEY: Joi.string().optional(),
  REALITY_SHORT_ID: Joi.string().optional(),
  // Default data limit for new users (in bytes) - optional, default 100 GB
  DEFAULT_DATA_LIMIT: Joi.number().integer().min(0).optional(),
  // Days per month for subscription calculation - optional, default 30
  SUBSCRIPTION_DAYS_PER_MONTH: Joi.number().integer().min(1).optional(),
  // Trial configuration - optional with defaults
  TRIAL_DAYS: Joi.number().integer().min(1).optional(),
  TRIAL_IP_LIMIT: Joi.number().integer().min(1).optional(),
});
