import { Test, TestingModule } from '@nestjs/testing';
import { StartCommand } from './start.command';
import { UsersService } from '../../../users/users.service';
import { CommandContext } from '../base.action';

// Mock the UI module before imports
jest.mock('../../ui', () => ({
  MESSAGES: {
    MAIN_TITLE: '⚡️ Добро пожаловать в самый быстрый и стабильный VPN!',
    WELCOME_FIRST: '❤️ Лучший сервис по лучшей стоимости',
  },
  ACTIONS: {
    START_MENU: 'start_menu',
    SHOW_MAIN_MENU: 'show_main_menu',
    BACK_TO_MAIN: 'start_menu',
  },
  mainKeyboard: jest.fn(() => ({
    reply_markup: { inline_keyboard: [] },
  })),
  startButtonKeyboard: jest.fn(() => ({
    reply_markup: { inline_keyboard: [[{ text: '▶️ Старт', callback_data: 'show_main_menu' }]] },
  })),
}));

describe('StartCommand (Clean UI)', () => {
  let command: StartCommand;
  let usersService: { findOrCreate: jest.Mock };

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartCommand,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    command = module.get<StartCommand>(StartCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct pattern', () => {
    expect(command.pattern).toEqual(['start_menu', 'show_main_menu', 'start']);
  });

  describe('execute', () => {
    it('should create new user and send welcome screen with photo', async () => {
      usersService.findOrCreate.mockResolvedValue({ id: 1 });

      const context = createMockContext('start');
      context.ctx.replyWithPhoto = jest.fn().mockResolvedValue(undefined);

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

      // Verify welcome screen with photo was sent
      expect(context.ctx.replyWithPhoto).toHaveBeenCalled();
    });

    it('should send main menu when show_main_menu is triggered', async () => {
      usersService.findOrCreate.mockResolvedValue({ id: 1 });

      const context = createMockContext('show_main_menu');
      await command.execute(context);

      // Verify main menu was sent
      expect(context.ctx.reply).toHaveBeenCalledWith(
        '⚡️ Добро пожаловать в самый быстрый и стабильный VPN!',
        {
          reply_markup: { inline_keyboard: [] },
        },
      );
    });

    it('should handle missing user data gracefully', async () => {
      const context: CommandContext = {
        ctx: {
          from: undefined,
          reply: jest.fn(),
        } as unknown as CommandContext['ctx'],
        userId: mockUserId,
        data: 'start',
        args: [],
      };

      await command.execute(context);

      expect(usersService.findOrCreate).not.toHaveBeenCalled();
      expect(context.ctx.reply).not.toHaveBeenCalled();
    });
  });
});
