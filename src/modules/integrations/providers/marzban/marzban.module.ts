import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarzbanService } from './marzban.service';
import { MarzbanAuthService } from './marzban-auth.service';
import { MarzbanCertificateService } from './marzban-certificate.service';
import { MarzbanNodeService } from './marzban-node.service';
import { MarzbanUserService } from './marzban-user.service';

@Module({
  providers: [
    MarzbanService,
    MarzbanAuthService,
    MarzbanCertificateService,
    MarzbanNodeService,
    MarzbanUserService,
    ConfigService,
  ],
  exports: [
    MarzbanService,
    MarzbanAuthService,
    MarzbanCertificateService,
    MarzbanNodeService,
    MarzbanUserService,
  ],
})
export class MarzbanModule {}
