import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XuiApiService } from './xui-api.service';
import { XuiAuthService } from './xui-auth.service';
import { XuiInboundService } from './xui-inbound.service';
import { XuiClientService } from './xui-client.service';
import { XuiUrlService } from './xui-url.service';

@Module({
  providers: [
    XuiApiService,
    XuiAuthService,
    XuiInboundService,
    XuiClientService,
    XuiUrlService,
    ConfigService,
  ],
  exports: [
    XuiApiService,
    XuiAuthService,
    XuiInboundService,
    XuiClientService,
    XuiUrlService,
  ],
})
export class XuiModule {}
