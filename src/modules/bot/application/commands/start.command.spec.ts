import { Test, TestingModule } from '@nestjs/testing';
import { StartCommand } from './start.command';
import { UsersService } from '../../../users/users.service';
import { CommandContext } from '../base.action';

// Mock the UI module before imports
jest.mock('../../ui', () => ({
  START_MESSAGES: {
    WELCOME: jest.fn((name: string) => `Welcome ${name}`),
  },
  START_ACTIONS: {
    BACK_TO_START: 'back_to_start',
    START: 'start',
  },
  startKeyboard: jest.fn(() => ({ reply_markup: 'keyboard' })),
}));

// Import after mock
const { START_MESSAGES, START_ACTIONS, startKeyboard } = jest.requireMock('../../ui') as {
  START_MESSAGES: { WELCOME: jest.Mock };
  START_ACTIONS: { BACK_TO_START: string; START: string };
  startKeyboard: jest.Mock;
};

describe('StartCommand (Integration)', () => {
  let command: StartCommand;
  let usersService: { findByTelegramId: jest.Mock; create: jest.Mock };

  const mockUserId = 123456789;
  const mockUsername = 'testuser';
  const mockFirstName = 'Test';

  const createMockContext = (data: string): CommandContext => ({
    ctx: {
      from: {
        id: mockUserId,
        username: mockUsername,
        first_name: mockFirstName,
      },
      reply: jest.fn().mockResolvedValue(undefined),
    } as unknown as CommandContext['ctx'],
    userId: mockUserId,
    data,
    args: [],
  });

  beforeEach(async () => {
    usersService = {
      findByTelegramId: jest.fn(),
      create: jest.fn(),
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
    expect(command.pattern).toEqual(['back_to_start', 'start']);
  });

  describe('execute', () => {
    it('should create new user when not exists and send welcome message', async () => {
      usersService.findByTelegramId.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 1 });

      const context = createMockContext('start');
      await command.execute(context);

      // Verify repository calls
      expect(usersService.findByTelegramId).toHaveBeenCalledWith(mockUserId);
      expect(usersService.create).toHaveBeenCalledWith({
        telegramId: mockUserId,
        username: mockUsername,
        firstName: mockFirstName,
        status: 'active',
        subscriptionType: 'free',
      });

      // Verify UI messages were called
      expect(START_MESSAGES.WELCOME).toHaveBeenCalledWith(mockFirstName);
      expect(startKeyboard).toHaveBeenCalled();

      // Verify reply was sent
      expect(context.ctx.reply).toHaveBeenCalledWith(
        'Welcome Test',
        { reply_markup: 'keyboard' }
      );
    });

    it('should not create user when already exists', async () => {
      usersService.findByTelegramId.mockResolvedValue({ id: 1, telegramId: mockUserId });

      const context = createMockContext('start');
      await command.execute(context);

      expect(usersService.findByTelegramId).toHaveBeenCalledWith(mockUserId);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(context.ctx.reply).toHaveBeenCalled();
    });

    it('should handle missing user data gracefully', async () => {
      const context: CommandContext = {
        ctx: { from: undefined, reply: jest.fn() } as unknown as CommandContext['ctx'],
        userId: mockUserId,
        data: 'start',
        args: [],
      };

      await command.execute(context);

      expect(usersService.findByTelegramId).not.toHaveBeenCalled();
      expect(context.ctx.reply).not.toHaveBeenCalled();
    });
  });
});
