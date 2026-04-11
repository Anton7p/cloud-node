import { Test, TestingModule } from '@nestjs/testing';
import { RentTermCommand } from './rent-term.command';
import { RentalsService } from '../../../rentals/rentals.service';
import { CommandContext } from '../base.action';

// Mock the UI module
jest.mock('../../ui', () => ({
  RENT_MESSAGES: {
    TERM_DETAILS: jest.fn(
      (months: number, price: string) => `Rent for ${months} months: ${price}`,
    ),
  },
  RENT_PATTERNS: {
    RENT_TERM: /^rent_(\d+)m$/,
  },
  UI_UTILS: {
    getRentalPrice: jest.fn((months: number) =>
      months === 1 ? { months: 1, price: 10, label: '1 month' } : null,
    ),
  },
  rentTermDetailsKeyboard: jest.fn(() => ({ reply_markup: 'keyboard' })),
}));

// Import after mock
const { RENT_MESSAGES, RENT_PATTERNS, UI_UTILS, rentTermDetailsKeyboard } =
  jest.requireMock('../../ui') as {
    RENT_MESSAGES: { TERM_DETAILS: jest.Mock };
    RENT_PATTERNS: { RENT_TERM: RegExp };
    UI_UTILS: { getRentalPrice: jest.Mock };
    rentTermDetailsKeyboard: jest.Mock;
  };

describe('RentTermCommand (Integration)', () => {
  let command: RentTermCommand;
  let rentalsService: { createPendingRental: jest.Mock };

  const mockUserId = 123456789;

  const createMockContext = (data: string, args: string[]): CommandContext => ({
    ctx: {
      reply: jest.fn().mockResolvedValue(undefined),
      sendChatAction: jest.fn().mockResolvedValue(undefined),
    } as unknown as CommandContext['ctx'],
    userId: mockUserId,
    data,
    args,
  });

  beforeEach(async () => {
    rentalsService = {
      createPendingRental: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentTermCommand,
        { provide: RentalsService, useValue: rentalsService },
      ],
    }).compile();

    command = module.get<RentTermCommand>(RentTermCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct pattern', () => {
    expect(command.pattern).toBe(RENT_PATTERNS.RENT_TERM);
    expect('rent_1m').toMatch(RENT_PATTERNS.RENT_TERM);
    expect('rent_3m').toMatch(RENT_PATTERNS.RENT_TERM);
    expect('rent_12m').toMatch(RENT_PATTERNS.RENT_TERM);
  });

  describe('execute', () => {
    it('should create pending rental and send term details for 1 month', async () => {
      rentalsService.createPendingRental.mockResolvedValue({ id: 1 });

      const context = createMockContext('rent_1m', ['1']);
      await command.execute(context);

      // Verify repository call
      expect(rentalsService.createPendingRental).toHaveBeenCalledWith(
        mockUserId,
        1,
      );

      // Verify UI utilities were called
      expect(UI_UTILS.getRentalPrice).toHaveBeenCalledWith(1);
      expect(RENT_MESSAGES.TERM_DETAILS).toHaveBeenCalledWith(1, '10$');
      expect(rentTermDetailsKeyboard).toHaveBeenCalled();

      // Verify reply was sent with correct options
      expect(context.ctx.reply).toHaveBeenCalledWith('Rent for 1 months: 10$', {
        parse_mode: 'Markdown',
        reply_markup: 'keyboard',
      });
    });

    it('should handle 3 months term', async () => {
      rentalsService.createPendingRental.mockResolvedValue({ id: 2 });

      // Update mock for 3 months
      (UI_UTILS.getRentalPrice as jest.Mock).mockReturnValue({
        months: 3,
        price: 25,
        label: '3 months',
      });

      const context = createMockContext('rent_3m', ['3']);
      await command.execute(context);

      expect(rentalsService.createPendingRental).toHaveBeenCalledWith(
        mockUserId,
        3,
      );
      expect(UI_UTILS.getRentalPrice).toHaveBeenCalledWith(3);
    });

    it('should not create rental for invalid months', async () => {
      const context = createMockContext('rent_invalid', ['invalid']);
      await command.execute(context);

      expect(rentalsService.createPendingRental).not.toHaveBeenCalled();
      expect(context.ctx.reply).not.toHaveBeenCalled();
    });

    it('should handle unknown price gracefully', async () => {
      rentalsService.createPendingRental.mockResolvedValue({ id: 3 });
      (UI_UTILS.getRentalPrice as jest.Mock).mockReturnValue(null);

      const context = createMockContext('rent_99m', ['99']);
      await command.execute(context);

      expect(rentalsService.createPendingRental).toHaveBeenCalledWith(
        mockUserId,
        99,
      );
      expect(RENT_MESSAGES.TERM_DETAILS).toHaveBeenCalledWith(99, 'Неизвестно');
    });
  });
});
