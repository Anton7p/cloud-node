export interface XuiLoginResponse {
  success: boolean;
  msg?: string;
  obj?: {
    token?: string;
  };
}

export interface XuiInbound {
  id: number;
  port: number;
  protocol: string;
  settings: string;
  streamSettings: string;
  remark: string;
  enable: boolean;
  up: number;
  down: number;
  total: number;
}

export interface XuiInboundsResponse {
  success: boolean;
  msg?: string;
  obj?: XuiInbound[];
}

export interface XuiAddClientResponse {
  success: boolean;
  msg?: string;
}

export interface XuiClientData {
  email: string;
  id?: string;
  password?: string;
  flow?: string;
  limitIp?: number;
  totalGB?: number;
  expireDays?: number;
}

export interface XuiCredentials {
  username: string;
  password: string;
}

export interface XuiStreamSettings {
  network?: string;
  security?: string;
  wsSettings?: { path?: string };
  realitySettings?: {
    show?: boolean;
    xver?: number;
    dest?: string;
    serverNames?: string[];
    privateKey?: string;
    minClient?: string;
    maxClient?: string;
    maxTimediff?: number;
    shortIds?: string[];
    settings?: {
      publicKey?: string;
      fingerprint?: string;
      serverName?: string;
      spiderX?: string;
    };
  };
  tcpSettings?: {
    header?: {
      type?: string;
    };
  };
  grpcSettings?: {
    serviceName?: string;
  };
}
