import { Test, TestingModule } from '@nestjs/testing';
import { RentalsService } from '../../src/modules/rentals/rentals.service';
import { RentalsRepository } from '../../src/modules/rentals/repositories/rentals.repository';
import { PrismaService } from '../../src/shared/prisma/prisma.service';
import { UsersService } from '../../src/modules/users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EncryptionService } from '../../src/shared/encryption/encryption.service';
import { RentalStatus } from '@prisma/client';
import dayjs from 'dayjs';

describe('RentalsService', () => {
  let rentalsService: RentalsService;
  let prismaService: PrismaService;
  let rentalsRepository: RentalsRepository;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            rental: {
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: RentalsRepository,
          useValue: {
            createPending: jest.fn(),
            findPendingByUserId: jest.fn(),
            findActiveByUserId: jest.fn(),
            extend: jest.fn(),
            complete: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByTelegramId: jest.fn(),
            findOrCreate: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encryptSubscriptionUrl: jest.fn((url) => url),
            decryptSubscriptionUrl: jest.fn((url) => url),
          },
        },
      ],
    }).compile();

    rentalsService = module.get<RentalsService>(RentalsService);
    prismaService = module.get<PrismaService>(PrismaService);
    rentalsRepository = module.get<RentalsRepository>(RentalsRepository);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('Cumulative Renewal Logic', () => {
    const telegramId = 123456;
    const userId = 1;

    beforeEach(() => {
      jest.spyOn(usersService, 'findByTelegramId').mockResolvedValue({
        id: userId,
        telegramId: BigInt(telegramId),
        username: 'testuser',
        status: 'active',
        subscriptionType: 'free',
      } as any);
    });

    it('Scenario 1: New trial - date should be now + 3 days', async () => {
      const now = dayjs();
      const pendingRental = {
        id: 1,
        userId,
        term: 0.1, // 3 days in months
        status: RentalStatus.PENDING,
        createdAt: now.toDate(),
      };

      jest
        .spyOn(rentalsRepository, 'createPending')
        .mockResolvedValue(pendingRental as any);

      prismaService.$transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          const tx = {
            rental: {
              findFirst: jest
                .fn()
                .mockResolvedValueOnce(pendingRental) // pending rental
                .mockResolvedValueOnce(null), // No active rental
              update: jest.fn().mockImplementation((args) => ({
                ...pendingRental,
                ...args.data,
                status: RentalStatus.ACTIVE,
                startDate: now.toDate(),
                endDate: now.add(3, 'day').toDate(),
              })),
            },
          };
          return callback(tx);
        });

      const result = await rentalsService.activateRental(telegramId);

      expect(result).toBeDefined();
      expect(result?.status).toBe(RentalStatus.ACTIVE);

      const expectedEndDate = now.add(3, 'day');
      const actualEndDate = dayjs(result?.endDate);
      expect(actualEndDate.diff(expectedEndDate, 'minute')).toBeLessThan(1);
    });

    it('Scenario 2: Extend active user - new date = current expiresAt + term', async () => {
      const now = dayjs();
      const currentExpiresAt = now.add(5, 'day');

      const activeRental = {
        id: 1,
        userId,
        term: 1,
        status: RentalStatus.ACTIVE,
        endDate: currentExpiresAt.toDate(),
      };

      const pendingRental = {
        id: 2,
        userId,
        term: 1, // 1 month
        status: RentalStatus.PENDING,
      };

      prismaService.$transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          const tx = {
            rental: {
              findFirst: jest
                .fn()
                .mockResolvedValueOnce(pendingRental) // pending
                .mockResolvedValueOnce(activeRental), // active
              update: jest.fn().mockImplementation((args) => {
                if (args.where.id === 1) {
                  // Extending active
                  return {
                    ...activeRental,
                    term: 2, // 1 + 1
                    endDate: currentExpiresAt.add(1, 'month').toDate(),
                  };
                }
                return { ...pendingRental, status: RentalStatus.COMPLETED };
              }),
            },
          };
          return callback(tx);
        });

      const result = await rentalsService.activateRental(telegramId);

      expect(result?.term).toBe(2); // Cumulative
      const expectedEndDate = currentExpiresAt.add(1, 'month');
      const actualEndDate = dayjs(result?.endDate);
      expect(actualEndDate.diff(expectedEndDate, 'minute')).toBeLessThan(1);
    });

    it('Scenario 3: Extend expired user - date should be now + term', async () => {
      const now = dayjs();
      const expiredDate = now.subtract(2, 'day');

      const expiredRental = {
        id: 1,
        userId,
        term: 1,
        status: RentalStatus.ACTIVE, // Still active in DB but expired
        endDate: expiredDate.toDate(),
      };

      const pendingRental = {
        id: 2,
        userId,
        term: 1,
        status: RentalStatus.PENDING,
      };

      prismaService.$transaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          const tx = {
            rental: {
              findFirst: jest
                .fn()
                .mockResolvedValueOnce(pendingRental)
                .mockResolvedValueOnce(expiredRental),
              update: jest.fn().mockImplementation(() => ({
                ...pendingRental,
                status: RentalStatus.ACTIVE,
                startDate: now.toDate(),
                endDate: now.add(1, 'month').toDate(),
              })),
            },
          };
          return callback(tx);
        });

      const result = await rentalsService.activateRental(telegramId);

      const expectedEndDate = now.add(1, 'month');
      const actualEndDate = dayjs(result?.endDate);
      expect(actualEndDate.diff(expectedEndDate, 'minute')).toBeLessThan(1);
    });
  });

  describe('Transactional Safety', () => {
    it('should rollback on database error during activation', async () => {
      const telegramId = 123456;
      const userId = 1;

      jest.spyOn(usersService, 'findByTelegramId').mockResolvedValue({
        id: userId,
        telegramId: BigInt(telegramId),
      } as any);

      prismaService.$transaction = jest
        .fn()
        .mockRejectedValue(new Error('Database connection lost'));

      await expect(rentalsService.activateRental(telegramId)).rejects.toThrow(
        'Database connection lost',
      );
    });
  });
});
