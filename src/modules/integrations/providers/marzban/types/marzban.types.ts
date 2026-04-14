export interface MarzbanTokenResponse {
  access_token: string;
  token_type: string;
}

export interface MarzbanUserResponse {
  username: string;
  subscription_url: string;
  uuid?: string;
  expire?: number;
  data_limit?: number;
  status: string;
}

export interface MarzbanNode {
  id?: number;
  name: string;
  address: string;
  port: number;
  status?: string;
}

export interface MarzbanNodeSettings {
  certificate: string;
}

export interface CreateUserResult {
  success: boolean;
  subscriptionUrl?: string;
  username?: string;
  error?: string;
}

export interface MarzbanCredentials {
  username: string;
  password: string;
}

export const NODE_SERVICE_PORT = 62050;
export const DEFAULT_CERT_DIR = '/var/www/marzban_node/var';
export const CERT_FILENAME = 'ssl_client_cert.pem';
