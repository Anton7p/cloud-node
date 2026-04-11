import { Test, TestingModule } from '@nestjs/testing';
import { BotActionsService } from './bot-actions.service';
import { ModuleRef } from '@nestjs/core';
import { BotContext } from './types/bot.types';

// Store handlers for assertions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockHandlers: Record<string, any> = {};

// Mock all command imports
jest.mock('./application/commands/start.command', () => ({
  StartCommand: class MockStartCommand {
    readonly pattern = ['start', 'back_to_start'];
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/profile.command', () => ({
  ProfileCommand: class MockProfileCommand {
    readonly pattern = 'profile';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/rent-server.command', () => ({
  RentServerCommand: class MockRentServerCommand {
    readonly pattern = 'rent_server';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/rent-term.command', () => ({
  RentTermCommand: class MockRentTermCommand {
    readonly pattern = /^rent_(\d+)m$/;
    canHandle(data: string): boolean {
      return this.pattern.test(data);
    }
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/pay-rental.command', () => ({
  PayRentalCommand: class MockPayRentalCommand {
    readonly pattern = 'pay_rental';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/get-access.command', () => ({
  GetAccessCommand: class MockGetAccessCommand {
    readonly pattern = 'get_access';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/instructions.command', () => ({
  InstructionsCommand: class MockInstructionsCommand {
    readonly pattern = ['instructions', 'back_to_instructions'];
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/platform-instruction.command', () => ({
  PlatformInstructionCommand: class MockPlatformInstructionCommand {
    readonly pattern = /^instruction_(.+)$/;
    canHandle(data: string): boolean {
      return this.pattern.test(data);
    }
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/referral.command', () => ({
  ReferralCommand: class MockReferralCommand {
    readonly pattern = 'referral';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/help.command', () => ({
  HelpCommand: class MockHelpCommand {
    readonly pattern = 'help';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/key.command', () => ({
  KeyCommand: class MockKeyCommand {
    readonly pattern = ['get_key', 'key'];
    execute = jest.fn().mockResolvedValue(undefined);
  },
  Month1Command: class MockMonth1Command {
    readonly pattern = 'month_1';
    execute = jest.fn().mockResolvedValue(undefined);
  },
  Month3Command: class MockMonth3Command {
    readonly pattern = 'month_3';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/support.command', () => ({
  SupportCommand: class MockSupportCommand {
    readonly pattern = ['support', 'support_cmd'];
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock('./application/commands/platform-instructions.command', () => ({
  PlatformIosCommand: class MockPlatformIosCommand {
    readonly pattern = 'platform_ios';
    execute = jest.fn().mockResolvedValue(undefined);
  },
  PlatformAndroidCommand: class MockPlatformAndroidCommand {
    readonly pattern = 'platform_android';
    execute = jest.fn().mockResolvedValue(undefined);
  },
  PlatformWindowsCommand: class MockPlatformWindowsCommand {
    readonly pattern = 'platform_windows';
    execute = jest.fn().mockResolvedValue(undefined);
  },
  PlatformMacosCommand: class MockPlatformMacosCommand {
    readonly pattern = 'platform_macos';
    execute = jest.fn().mockResolvedValue(undefined);
  },
}));

describe('BotActionsService', () => {
  let service: BotActionsService;
  let moduleRef: { get: jest.Mock };
  let capturedHandlers: Record<string, { execute: jest.Mock }>;

  beforeEach(async () => {
    mockHandlers = {};
    capturedHandlers = {};
    let callCount = 0;
    const handlerNames = [
      'StartCommand',
      'KeyCommand',
      'Month1Command',
      'Month3Command',
      'CopyKeyCommand',
      'InstructionsCommand',
      'PlatformIosCommand',
      'PlatformAndroidCommand',
      'PlatformWindowsCommand',
      'PlatformMacosCommand',
      'SupportCommand',
    ];
    const patterns: (string | string[] | RegExp)[] = [
      ['back_to_main', 'start'],
      ['get_key', 'key'],
      'month_1',
      'month_3',
      /^copy_key:/,
      ['instructions', 'help'],
      'platform_ios',
      'platform_android',
      'platform_windows',
      'platform_macos',
      ['support', 'support_cmd'],
    ];

    moduleRef = {
      get: jest.fn(() => {
        const pattern = patterns[callCount];
        const handlerName = handlerNames[callCount];
        callCount++;

        const handler: Record<string, unknown> = {
          pattern,
          execute: jest.fn().mockResolvedValue(undefined),
          parseArgs: jest.fn().mockReturnValue([]),
          logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        };

        // Add canHandle for RegExp patterns
        if (pattern instanceof RegExp) {
          handler.canHandle = (data: string) => (pattern as RegExp).test(data);
        }

        if (handlerName) {
          mockHandlers[handlerName] = handler;
          capturedHandlers[handlerName] = handler as { execute: jest.Mock };
        }
        return handler;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotActionsService,
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();

    service = module.get<BotActionsService>(BotActionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should build handler map on initialization', async () => {
      await service.onModuleInit();
      expect(moduleRef.get).toHaveBeenCalledTimes(11);
    });
  });

  describe('handleStart', () => {
    it('should find and execute start handler', async () => {
      await service.onModuleInit();

      const mockCtx = {
        from: { id: 123456789 },
        reply: jest.fn().mockResolvedValue(undefined),
      } as unknown as BotContext;

      await service.handleStart(mockCtx);

      expect(mockHandlers['StartCommand']?.execute).toHaveBeenCalled();
      const callArg = mockHandlers['StartCommand']?.execute.mock.calls[0][0];
      expect(callArg.userId).toBe(123456789);
      expect(callArg.data).toBe('start');
    });

    it('should reply with unknown command when no handler found', async () => {
      // Setup with only non-matching handlers
      moduleRef.get.mockReturnValue({
        pattern: 'other',
        execute: jest.fn().mockResolvedValue(undefined),
      });
      await service.onModuleInit();

      const mockCtx = {
        from: { id: 123456789 },
        reply: jest.fn().mockResolvedValue(undefined),
      } as unknown as BotContext;

      await service.handleStart(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith('НЕИЗВЕСТНАЯ КОМАНДА');
    });
  });

  describe('handleCallbackQuery', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should route "back_to_main" callback to StartCommand via Map lookup', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue(undefined),
      } as unknown as BotContext;

      const startHandler = capturedHandlers['StartCommand'];

      await service.handleCallbackQuery(mockCtx, 'back_to_main', 123456789);

      expect(startHandler.execute).toHaveBeenCalled();
    });

    it('should route "get_key" callback to KeyCommand via Map lookup', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue(undefined),
      } as unknown as BotContext;

      const keyHandler = capturedHandlers['KeyCommand'];

      await service.handleCallbackQuery(mockCtx, 'get_key', 123456789);

      expect(keyHandler.execute).toHaveBeenCalled();
    });

    it('should route "instructions" callback to InstructionsCommand via Map lookup', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue(undefined),
      } as unknown as BotContext;

      const instructionsHandler = capturedHandlers['InstructionsCommand'];

      await service.handleCallbackQuery(mockCtx, 'instructions', 123456789);

      expect(instructionsHandler.execute).toHaveBeenCalled();
    });

    it('should route copy_key pattern via RegExp handler', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue(undefined),
      } as unknown as BotContext;

      const copyKeyHandler = capturedHandlers['CopyKeyCommand'];

      await service.handleCallbackQuery(mockCtx, 'copy_key:test123', 123456789);

      expect(copyKeyHandler.execute).toHaveBeenCalled();
    });

    it('should reply unknown command for unrecognized callback', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue(undefined),
      } as unknown as BotContext;

      await service.handleCallbackQuery(mockCtx, 'unknown_action', 123456789);

      expect(mockCtx.reply).toHaveBeenCalledWith('НЕИЗВЕСТНАЯ КОМАНДА');
    });
  });
});
