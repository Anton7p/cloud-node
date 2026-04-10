/**
 * ServerProvider Interface - Unified contract for server rental integrations
 *
 * This interface defines the standard operations for managing Server Rentals
 * and Computing Slots across different VPN protocols (VLESS, Shadowsocks, etc.).
 *
 * Terminology:
 * - Server Rental: A leased computing resource with specific configuration
 * - Computing Slot: An allocated resource unit within a rental (e.g., user slot)
 */

/**
 * Connection credentials for accessing a server rental
 */
export interface ServerCredentials {
  host: string;
  port: number;
  username?: string;
  password?: string;
  privateKey?: string;
  apiToken?: string;
}

/**
 * Configuration for a new Server Rental
 */
export interface RentalConfig {
  region: string;
  tier: 'basic' | 'standard' | 'premium';
  computingSlots: number;
  bandwidthLimit?: number; // in GB
  durationDays: number;
  protocol: 'vless' | 'shadowsocks' | 'trojan';
}

/**
 * Represents an active Server Rental
 */
export interface ServerRental {
  id: string;
  externalId: string; // Provider-specific ID
  credentials: ServerCredentials;
  config: RentalConfig;
  status: 'provisioning' | 'active' | 'suspended' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * Computing Slot - allocated resource within a Server Rental
 */
export interface ComputingSlot {
  id: string;
  rentalId: string;
  userId: string;
  accessKey: string;
  protocol: string;
  connectionUrl: string;
  qrCodeData: string;
  status: 'active' | 'suspended' | 'revoked';
  allocatedAt: Date;
  expiresAt: Date;
  trafficUsed: number; // in bytes
  trafficLimit: number; // in bytes
}

/**
 * Traffic statistics for monitoring
 */
export interface TrafficStats {
  slotId: string;
  uploadBytes: number;
  downloadBytes: number;
  totalBytes: number;
  timestamp: Date;
}

/**
 * ServerProvider - Base interface for all server rental integrations
 *
 * Implementations:
 * - VlessProvider: VLESS protocol management
 * - ShadowsocksProvider: Shadowsocks protocol management
 * - TrojanProvider: Trojan protocol management
 */
export interface IServerProvider {
  readonly name: string;
  readonly supportedProtocols: string[];

  /**
   * Health check - verify provider connectivity
   */
  healthCheck(): Promise<boolean>;

  /**
   * Provision a new Server Rental
   */
  provisionRental(config: RentalConfig): Promise<ServerRental>;

  /**
   * Terminate a Server Rental
   */
  terminateRental(rentalId: string): Promise<boolean>;

  /**
   * Get rental details
   */
  getRental(rentalId: string): Promise<ServerRental | null>;

  /**
   * Allocate a Computing Slot within a rental
   */
  allocateSlot(rentalId: string, userId: string): Promise<ComputingSlot>;

  /**
   * Revoke a Computing Slot
   */
  revokeSlot(slotId: string): Promise<boolean>;

  /**
   * Get slot details
   */
  getSlot(slotId: string): Promise<ComputingSlot | null>;

  /**
   * Get traffic statistics for a slot
   */
  getSlotTraffic(slotId: string): Promise<TrafficStats>;

  /**
   * Sync traffic data for all active slots
   */
  syncTrafficData(): Promise<TrafficStats[]>;

  /**
   * Renew rental duration
   */
  renewRental(rentalId: string, additionalDays: number): Promise<ServerRental>;

  /**
   * Suspend a rental (stop billing, disable access)
   */
  suspendRental(rentalId: string): Promise<boolean>;

  /**
   * Resume a suspended rental
   */
  resumeRental(rentalId: string): Promise<boolean>;
}
