import { Test, TestingModule } from '@nestjs/testing';
import { StartCommand } from './start.command';
import { UsersService } from '../../../users/users.service';
import { RentalsService } from '../../../rentals/rentals.service';
import { CommandContext } from '../base.action';

// Mock the UI module before imports
jest.mock('../../ui', () => ({
  MESSAGES: {
    MAIN_TITLE: jest.fn(
      (firstName: string, hasSubscription: boolean) =>
        `ПРИВЕТ, ${firstName.toUpperCase()}!\n\n` +
        `СТАТУС: ${hasSubscription ? '✅ АКТИВЕН' : '📋 НЕТ КЛЮЧА'}`,
    ),
  },
  ACTIONS: {
    BACK_TO_MAIN: 'back_to_main',
  },
  IMAGES: {
    START_HUD: 'assets/images/start_hud.jpg.jpg',
  },
  mainKeyboard: jest.fn(() => ({
    reply_markup: { inline_keyboard: [] },
  })),
  removeReplyKeyboard: jest.fn(() => ({
    reply_markup: { remove_keyboard: true },
  })),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
}));

describe('StartCommand (Clean UI)', () => {
  let command: StartCommand;
  let usersService: { findOrCreate: jest.Mock };
  let rentalsService: { getActiveRental: jest.Mock };

  const mockUserId = 123456789;
  const mockUsername = 'testuser';
  const mockFirstName = 'Test';

  const createMockContext = (
    data: string,
    isCallback = false,
  ): CommandContext => {
    const baseCtx = {
      from: {
        id: mockUserId,
        username: mockUsername,
        first_name: mockFirstName,
      },
      replyWithPhoto: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
    } as unknown as CommandContext['ctx'];

    if (isCallback) {
      (
        baseCtx as unknown as { callbackQuery: { message: unknown } }
      ).callbackQuery = {
        message: { message_id: 123 },
      };
    }

    return {
      ctx: baseCtx,
      userId: mockUserId,
      data,
      args: [],
    };
  };

  beforeEach(async () => {
    usersService = {
      findOrCreate: jest.fn(),
    };
    rentalsService = {
      getActiveRental: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartCommand,
        { provide: UsersService, useValue: usersService },
        { provide: RentalsService, useValue: rentalsService },
      ],
    }).compile();

    command = module.get<StartCommand>(StartCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct pattern', () => {
    expect(command.pattern).toEqual(['back_to_main', 'start']);
  });

  describe('execute', () => {
    it('should create new user and send main menu with photo (no subscription)', async () => {
      usersService.findOrCreate.mockResolvedValue({ id: 1 });
      rentalsService.getActiveRental.mockResolvedValue(null);

      const context = createMockContext('start');
      await command.execute(context);

      // Verify user registration
      expect(usersService.findOrCreate).toHaveBeenCalledWith(mockUserId, {
        telegramId: mockUserId,
        username: mockUsername,
        firstName: mockFirstName,
        languageCode: undefined,
        status: 'active',
        subscriptionType: 'free',
      });

      // Verify active rental was checked
      expect(rentalsService.getActiveRental).toHaveBeenCalledWith(mockUserId);

      // Verify photo was sent
      expect(context.ctx.replyWithPhoto).toHaveBeenCalledWith(
        { source: expect.any(String) },
        {
          caption: expect.stringContaining('ПРИВЕТ'),
          reply_markup: { inline_keyboard: [] },
        },
      );
    });

    it('should show extend button when user has active subscription', async () => {
      usersService.findOrCreate.mockResolvedValue({ id: 1 });
      rentalsService.getActiveRental.mockResolvedValue({
        id: 1,
        endDate: new Date('2025-12-31'),
      });

      const context = createMockContext('start');
      await command.execute(context);

      expect(rentalsService.getActiveRental).toHaveBeenCalledWith(mockUserId);
      expect(context.ctx.replyWithPhoto).toHaveBeenCalledWith(
        { source: expect.any(String) },
        {
          caption: expect.stringContaining('✅ АКТИВЕН'),
          reply_markup: { inline_keyboard: [] },
        },
      );
    });

    it('should handle missing user data gracefully', async () => {
      const context: CommandContext = {
        ctx: {
          from: undefined,
          replyWithPhoto: jest.fn(),
          reply: jest.fn(),
        } as unknown as CommandContext['ctx'],
        userId: mockUserId,
        data: 'start',
        args: [],
      };

      await command.execute(context);

      expect(usersService.findOrCreate).not.toHaveBeenCalled();
      expect(rentalsService.getActiveRental).not.toHaveBeenCalled();
      expect(context.ctx.replyWithPhoto).not.toHaveBeenCalled();
    });
  });
});
