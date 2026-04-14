import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { XuiApiService } from './xui-api.service';
import { XuiAuthService } from './xui-auth.service';
import { XuiInboundService } from './xui-inbound.service';
import { XuiClientService } from './xui-client.service';
import { XuiUrlService } from './xui-url.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    XuiApiService,
    XuiAuthService,
    XuiInboundService,
    XuiClientService,
    XuiUrlService,
  ],
  exports: [XuiApiService],
})
export class XuiModule {}
