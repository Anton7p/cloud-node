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
  /** Протухший JWT: фасад может перелогиниться и повторить запрос. */
  unauthorized?: boolean;
}

export type SuspendUserResult =
  | { ok: true }
  | { ok: false; unauthorized: boolean };

export interface MarzbanCredentials {
  username: string;
  password: string;
}
