import { Injectable } from '@nestjs/common';
import { MarzbanService } from '../providers/marzban/marzban.service';
import { IVpnPanelAdapter, ProvisionUserResult } from './vpn-panel.interface';

@Injectable()
export class MarzbanVpnPanelAdapter implements IVpnPanelAdapter {
  constructor(private readonly marzbanService: MarzbanService) {}

  async provisionUser(
    telegramUserId: string,
    months: number,
  ): Promise<ProvisionUserResult> {
    const r = await this.marzbanService.createUser(telegramUserId, months);
    return {
      success: r.success,
      subscriptionUrl: r.subscriptionUrl,
      externalUsername: r.username,
      error: r.error,
    };
  }

  async suspendUser(telegramUserId: string): Promise<boolean> {
    return this.marzbanService.suspendUser(telegramUserId);
  }
}
