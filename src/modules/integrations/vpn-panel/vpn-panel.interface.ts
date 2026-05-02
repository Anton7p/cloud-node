/**
 * Neutral result type for provisioning a VPN subscriber at the panel.
 * Bot and workers depend only on this, not on Marzban-specific DTOs.
 */
export interface ProvisionUserResult {
  success: boolean;
  subscriptionUrl?: string;
  /** Panel-side username/id (e.g. Marzban `user_123456`). */
  externalUsername?: string;
  error?: string;
}

/**
 * Contract for whichever VPN backend is wired in (Marzban, 3x-ui, …).
 */
export interface IVpnPanelAdapter {
  /**
   * Create or reconcile a VPN user keyed by Telegram id and return subscription link.
   * @param telegramUserId - stable id string (digits)
   * @param months - subscription length in months (0 / fractional = trial rules inside impl)
   */
  provisionUser(
    telegramUserId: string,
    months: number,
  ): Promise<ProvisionUserResult>;

  /**
   * Disable access for the subscriber (e.g. subscription expired).
   */
  suspendUser(telegramUserId: string): Promise<boolean>;
}
