import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { MarzbanNodeSettings } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MarzbanCertificateService {
  private readonly logger = new Logger(MarzbanCertificateService.name);
  private readonly certPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: AxiosInstance,
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

      const response =
        await this.httpClient.get<MarzbanNodeSettings>('/node/settings');

      if (!response.data?.certificate) {
        this.logger.warn('No certificate returned from Marzban API');
        return;
      }

      const certDir = path.dirname(this.certPath);

      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
        this.logger.log(`Created certificate directory: ${certDir}`);
      }

      fs.writeFileSync(this.certPath, response.data.certificate, {
        mode: 0o644,
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
  certificateExists(): boolean {
    try {
      return (
        fs.existsSync(this.certPath) && fs.statSync(this.certPath).isFile()
      );
    } catch {
      return false;
    }
  }
}
