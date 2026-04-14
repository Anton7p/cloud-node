import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarzbanNodeSettings } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarzbanService } from './marzban.service';

@Injectable()
export class MarzbanCertificateService {
  private readonly logger = new Logger(MarzbanCertificateService.name);
  private readonly certPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly marzbanService: MarzbanService,
  ) {
    const certDir =
      this.configService.get<AppConfig['marzbanNodeCertDir']>(
        'app.marzbanNodeCertDir',
      ) || '/var/www/marzban_node/var';
    this.certPath = path.join(certDir, 'ssl_client_cert.pem');
  }

  /**
   * Fetch SSL certificate from Marzban Master and save it locally
   */
  async fetchAndSaveCert(): Promise<void> {
    try {
      this.logger.log('Fetching SSL certificate from Marzban Master...');

      const response = await this.marzbanService
        .getAxiosInstance()
        .get<MarzbanNodeSettings>('/node/settings');

      if (!response.data?.certificate) {
        this.logger.warn('No certificate returned from Marzban API');
        return;
      }

      const certDir = path.dirname(this.certPath);

      try {
        await fs.access(certDir);
      } catch {
        await fs.mkdir(certDir, { recursive: true });
        this.logger.log(`Created certificate directory: ${certDir}`);
      }

      await fs.writeFile(this.certPath, response.data.certificate, {
        mode: 0o600,
      });

      this.logger.log(`SSL certificate saved to: ${this.certPath}`);
    } catch (error) {
      this.logger.error(
        'Failed to fetch and save certificate:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  getCertPath(): string {
    return this.certPath;
  }

  /**
   * Check if certificate exists and is readable
   */
  async certificateExists(): Promise<boolean> {
    try {
      const stat = await fs.stat(this.certPath);
      return stat.isFile();
    } catch {
      return false;
    }
  }
}
