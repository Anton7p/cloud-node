import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AppConfig } from '../config/configuration';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey =
      this.configService.get<AppConfig['encryptionKey']>('app.encryptionKey');

    if (!encryptionKey) {
      this.logger.warn('ENCRYPTION_KEY not configured - using fallback key');
      // Fallback key for development (32 bytes)
      this.key = crypto.randomBytes(32);
    } else {
      // Derive 32-byte key from provided key using SHA-256
      this.key = crypto.createHash('sha256').update(encryptionKey).digest();
    }
  }

  /**
   * Encrypt a string using AES-256-GCM
   */
  encrypt(text: string): string {
    try {
      // Generate random IV (16 bytes for AES)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV, authTag, and encrypted data
      const result =
        iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

      return result;
    } catch (error) {
      this.logger.error(
        'Encryption failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  /**
   * Decrypt a string using AES-256-GCM
   */
  decrypt(encryptedText: string): string {
    try {
      // Split the encrypted text into IV, authTag, and encrypted data
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(
        'Decryption failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  /**
   * Encrypt subscription URL before saving to database
   */
  encryptSubscriptionUrl(url: string): string {
    return this.encrypt(url);
  }

  /**
   * Decrypt subscription URL after retrieving from database
   */
  decryptSubscriptionUrl(encryptedUrl: string): string {
    return this.decrypt(encryptedUrl);
  }
}
