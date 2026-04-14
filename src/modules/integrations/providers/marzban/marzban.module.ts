import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MarzbanService } from './marzban.service';
import { MarzbanAuthService } from './marzban-auth.service';
import { MarzbanCertificateService } from './marzban-certificate.service';
import { MarzbanNodeService } from './marzban-node.service';
import { MarzbanUserService } from './marzban-user.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    MarzbanService,
    MarzbanAuthService,
    MarzbanCertificateService,
    MarzbanNodeService,
    MarzbanUserService,
  ],
  exports: [MarzbanService],
})
export class MarzbanModule {}
