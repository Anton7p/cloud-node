import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { XuiUrlService } from '../../src/modules/integrations/providers/xui/xui-url.service';

describe('XuiUrlService', () => {
  let service: XuiUrlService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XuiUrlService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'app.domainName') return 'vpn.example.com';
              if (key === 'app.vpnPanelUrl')
                return 'http://cloudnode-marzban:8000';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<XuiUrlService>(XuiUrlService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('URL Generation', () => {
    it('should use DOMAIN_NAME when available', async () => {
      const inbounds = [
        {
          id: 1,
          port: 443,
          protocol: 'vless',
          settings: JSON.stringify({
            clients: [{ id: 'user-uuid', email: 'test@example.com' }],
          }),
          streamSettings: JSON.stringify({
            network: 'tcp',
            security: 'reality',
            realitySettings: {
              dest: 'google.com:443',
              serverNames: ['google.com'],
              privateKey: 'private-key',
              shortIds: ['short-id'],
              settings: {
                publicKey: 'public-key',
                fingerprint: 'chrome',
                serverName: 'google.com',
              },
            },
          }),
        },
      ];

      const result = await service.getClientLink(
        1,
        'test@example.com',
        inbounds as any,
      );

      expect(result).toContain('vpn.example.com');
      expect(result).not.toContain('cloudnode-marzban:8000');
    });

    it('should fallback to SERVER_IP when DOMAIN_NAME not set', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'app.domainName') return null;
        if (key === 'app.infrastructureIpList') return '192.168.1.100';
        if (key === 'app.vpnPanelUrl') return null; // null so it falls through to IP
        return null;
      });

      const inbounds = [
        {
          id: 1,
          port: 443,
          protocol: 'vless',
          settings: JSON.stringify({
            clients: [{ id: 'user-uuid', email: 'test@example.com' }],
          }),
          streamSettings: JSON.stringify({
            network: 'tcp',
            security: 'none',
          }),
        },
      ];

      const result = await service.getClientLink(
        1,
        'test@example.com',
        inbounds as any,
      );

      expect(result).toContain('192.168.1.100');
    });
  });

  describe('Reality Parameters', () => {
    it('should include all Reality parameters in link', async () => {
      const inbounds = [
        {
          id: 1,
          port: 443,
          protocol: 'vless',
          settings: JSON.stringify({
            clients: [{ id: 'user-uuid-123', email: 'test@example.com' }],
          }),
          streamSettings: JSON.stringify({
            network: 'tcp',
            security: 'reality',
            realitySettings: {
              dest: 'google.com:443',
              serverNames: ['google.com', 'www.google.com'],
              privateKey: 'private-key-here',
              shortIds: ['abcd1234'],
              settings: {
                publicKey: 'public-key-here',
                fingerprint: 'chrome',
                serverName: 'google.com',
              },
            },
          }),
        },
      ];

      const result = await service.getClientLink(
        1,
        'test@example.com',
        inbounds as any,
      );

      // Should contain Reality-specific parameters
      expect(result).toContain('security=reality');
      expect(result).toContain('pbk=public-key-here');
      expect(result).toContain('sid=abcd1234');
      expect(result).toContain('sni=google.com');
      expect(result).toContain('fp=chrome');
    });

    it('should handle missing Reality settings gracefully', async () => {
      const inbounds = [
        {
          id: 1,
          port: 443,
          protocol: 'vless',
          settings: JSON.stringify({
            clients: [{ id: 'user-uuid', email: 'test@example.com' }],
          }),
          streamSettings: JSON.stringify({
            network: 'tcp',
            security: 'none',
          }),
        },
      ];

      const result = await service.getClientLink(
        1,
        'test@example.com',
        inbounds as any,
      );

      expect(result).not.toContain('pbk=');
      expect(result).not.toContain('sid=');
      expect(result).toContain('vless://');
    });
  });
});
