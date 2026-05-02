import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MarzbanModule } from '../providers/marzban/marzban.module';
import { AppConfig } from '../../../shared/config/configuration';
import { VPN_PANEL_ADAPTER } from './vpn-panel.tokens';
import { IVpnPanelAdapter } from './vpn-panel.interface';
import { MarzbanVpnPanelAdapter } from './marzban-vpn-panel.adapter';

@Module({
  imports: [ConfigModule, MarzbanModule],
  providers: [
    MarzbanVpnPanelAdapter,
    {
      provide: VPN_PANEL_ADAPTER,
      useFactory: (
        config: ConfigService,
        marzbanAdapter: MarzbanVpnPanelAdapter,
      ): IVpnPanelAdapter => {
        const kind =
          config.get<AppConfig['vpnPanelAdapter']>('app.vpnPanelAdapter') ??
          'marzban';
        if (kind === 'marzban') return marzbanAdapter;
        throw new Error(
          `VPN panel adapter "${kind}" is not implemented. Supported: marzban`,
        );
      },
      inject: [ConfigService, MarzbanVpnPanelAdapter],
    },
  ],
  exports: [VPN_PANEL_ADAPTER, MarzbanModule],
})
export class VpnPanelModule {}
