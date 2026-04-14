import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarzbanNodeSettings } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarzbanApiClient } from './marzban-api-client.service';

@Injectable()
export class MarzbanCertificateService {
  private readonly logger = new Logger(MarzbanCertificateService.name);
  private readonly certPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly apiClient: MarzbanApiClient,
  ) {
    const certDir =
      this.configService.get<AppConfig['marzbanNodeCertDir']>(
        'app.marzbanNodeCertDir',
      ) || '/var/www/marzban_node/var';
    this.certPath = path.join(certDir, 'ssl_client_cert.pem');
  }

  /**
   * Check directory permissions (existence, writable)
   * @param dirPath - directory path to check
   * @returns object with status and error message if applicable
   */
  async checkDirectoryPermissions(dirPath: string): Promise<{
    ok: boolean;
    error?: string;
  }> {
    try {
      // Check if directory exists
      try {
        await fs.access(dirPath);
      } catch {
        // Directory doesn't exist, try to create it
        try {
          await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
          this.logger.log(`Created certificate directory: ${dirPath}`);
        } catch (mkdirError) {
          return {
            ok: false,
            error: `Cannot create directory ${dirPath}: ${mkdirError instanceof Error ? mkdirError.message : 'Unknown error'}`,
          };
        }
      }

      // Check if directory is writable by attempting to write a test file
      const testFile = path.join(dirPath, '.write_test');
      try {
        await fs.writeFile(testFile, '', { mode: 0o600 });
        await fs.unlink(testFile);
      } catch (writeError) {
        return {
          ok: false,
          error: `Directory ${dirPath} is not writable: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`,
        };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: `Permission check failed for ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Fetch SSL certificate from Marzban Master and save it locally
   */
  async fetchAndSaveCert(): Promise<void> {
    try {
      this.logger.log('Fetching SSL certificate from Marzban Master...');

      const response = await this.apiClient
        .getAxiosInstance()
        .get<MarzbanNodeSettings>('/node/settings');

      if (!response.data?.certificate) {
        this.logger.warn('No certificate returned from Marzban API');
        return;
      }

      const certDir = path.dirname(this.certPath);

      // Check directory permissions before writing
      const permissionCheck = await this.checkDirectoryPermissions(certDir);
      if (!permissionCheck.ok) {
        this.logger.error(
          `Certificate directory permission check failed: ${permissionCheck.error}`,
        );
        return;
      }

      // Write certificate with restricted permissions (owner read/write only)
      await fs.writeFile(this.certPath, response.data.certificate, {
        mode: 0o600,
        flag: 'w',
      });

      // Verify file was written and has correct permissions
      const stats = await fs.stat(this.certPath);
      if (!stats.isFile()) {
        this.logger.error('Certificate file was not created properly');
        return;
      }

      // Check file mode (should be 0o600 = 384)
      const fileMode = stats.mode & 0o777;
      if (fileMode !== 0o600) {
        this.logger.warn(
          `Certificate file has unexpected permissions: ${fileMode.toString(8)}, expected 600`,
        );
      }

      this.logger.log(
        `SSL certificate saved to: ${this.certPath} (size: ${stats.size} bytes, mode: ${fileMode.toString(8)})`,
      );
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
