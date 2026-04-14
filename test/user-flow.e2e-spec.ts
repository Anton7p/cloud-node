import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { EncryptionModule } from '../src/shared/encryption/encryption.module';
import { PaymentService } from '../src/modules/payments/payment.service';
import { MarzbanService } from '../src/modules/integrations/providers/marzban/marzban.service';
import { RentalsService } from '../src/modules/rentals/rentals.service';
import { RentalsRepository } from '../src/modules/rentals/repositories/rentals.repository';
import { UsersService } from '../src/modules/users/users.service';
import { UsersRepository } from '../src/modules/users/repositories/users.repository';
import { RentalStatus } from '@prisma/client';
import dayjs from 'dayjs';

describe('User Flow E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let paymentService: PaymentService;
  let rentalsService: RentalsService;
  let usersService: UsersService;
  let eventEmitter: EventEmitter2;

  const telegramId = 123456789;
  const chatId = 987654321;

  // Mock data store for in-memory database simulation
  const mockUsers: Map<number, any> = new Map();
  const mockRentals: Map<number, any> = new Map();
  let userIdCounter = 1;
  let rentalIdCounter = 1;

  const createMockPrismaService = () => {
    const getUserByTelegramId = (telegramId: number) => {
      for (const user of mockUsers.values()) {
        if (user.telegramId === BigInt(telegramId)) return user;
      }
      return null;
    };

    const findFirstRental = (where: any) => {
      for (const rental of mockRentals.values()) {
        if (where?.userId !== undefined && rental.userId !== where.userId)
          continue;
        if (where?.status !== undefined && rental.status !== where.status)
          continue;
        if (where?.id !== undefined && rental.id !== where.id) continue;
        return { ...rental };
      }
      return null;
    };

    const updateRental = (where: any, data: any) => {
      const rental = mockRentals.get(where.id);
      if (rental) {
        Object.assign(rental, data);
      }
      return rental ? { ...rental } : null;
    };

    const createRental = (data: any) => {
      const rental = {
        id: rentalIdCounter++,
        ...data,
        createdAt: new Date(),
      };
      mockRentals.set(rental.id, rental);
      return { ...rental };
    };

    const updateManyRentals = (where: any, data: any) => {
      let count = 0;
      for (const rental of mockRentals.values()) {
        if (where?.userId !== undefined && rental.userId === where.userId) {
          if (where.status === undefined || rental.status === where.status) {
            Object.assign(rental, data);
            count++;
          }
        }
      }
      return { count };
    };

    return {
      user: {
        findUnique: jest.fn(({ where }: any) => {
          return Promise.resolve(getUserByTelegramId(where.telegramId));
        }),
        findFirst: jest.fn(({ where }: any) => {
          if (where.telegramId) {
            return Promise.resolve(getUserByTelegramId(where.telegramId));
          }
          return Promise.resolve(mockUsers.values().next().value || null);
        }),
        create: jest.fn(({ data }: any) => {
          const user = {
            id: userIdCounter++,
            ...data,
            telegramId:
              typeof data.telegramId === 'bigint'
                ? data.telegramId
                : BigInt(data.telegramId),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUsers.set(user.id, user);
          return Promise.resolve(user);
        }),
        upsert: jest.fn(({ where, create, update }: any) => {
          const existing = getUserByTelegramId(where.telegramId);
          if (existing) {
            Object.assign(existing, update, { updatedAt: new Date() });
            return Promise.resolve(existing);
          }
          const user = {
            id: userIdCounter++,
            ...create,
            telegramId:
              typeof create.telegramId === 'bigint'
                ? create.telegramId
                : BigInt(create.telegramId),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUsers.set(user.id, user);
          return Promise.resolve(user);
        }),
        deleteMany: jest.fn(({ where }: any) => {
          if (where.telegramId) {
            for (const [id, user] of mockUsers.entries()) {
              if (user.telegramId === BigInt(where.telegramId)) {
                mockUsers.delete(id);
                return Promise.resolve({ count: 1 });
              }
            }
          }
          mockUsers.clear();
          return Promise.resolve({ count: 0 });
        }),
      },
      rental: {
        findFirst: jest.fn(({ where }: any) => {
          return Promise.resolve(findFirstRental(where));
        }),
        findMany: jest.fn(() =>
          Promise.resolve(Array.from(mockRentals.values())),
        ),
        create: jest.fn(({ data }: any) => {
          return Promise.resolve(createRental(data));
        }),
        update: jest.fn(({ where, data }: any) => {
          return Promise.resolve(updateRental(where, data));
        }),
        updateMany: jest.fn(({ where, data }: any) => {
          return Promise.resolve(updateManyRentals(where, data));
        }),
        deleteMany: jest.fn(() => {
          mockRentals.clear();
          return Promise.resolve({ count: 0 });
        }),
      },
      $transaction: jest.fn(async (callback: any) => {
        const tx = {
          rental: {
            findFirst: jest.fn(({ where }: any) =>
              Promise.resolve(findFirstRental(where)),
            ),
            findUnique: jest.fn(({ where }: any) =>
              Promise.resolve(mockRentals.get(where.id) || null),
            ),
            update: jest.fn(({ where, data }: any) =>
              Promise.resolve(updateRental(where, data)),
            ),
            updateMany: jest.fn(({ where, data }: any) =>
              Promise.resolve(updateManyRentals(where, data)),
            ),
            create: jest.fn(({ data }: any) =>
              Promise.resolve(createRental(data)),
            ),
          },
        };
        return callback(tx);
      }),
    };
  };

  beforeAll(async () => {
    const mockPrisma = createMockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        EncryptionModule,
      ],
      providers: [
        RentalsService,
        RentalsRepository,
        UsersService,
        UsersRepository,
        PaymentService,
        EventEmitter2,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: MarzbanService,
          useValue: {
            createUser: jest.fn().mockResolvedValue({
              success: true,
              subscriptionUrl: 'https://test.example.com/sub/test-uuid',
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    paymentService = app.get<PaymentService>(PaymentService);
    rentalsService = app.get<RentalsService>(RentalsService);
    usersService = app.get<UsersService>(UsersService);
    eventEmitter = app.get<EventEmitter2>(EventEmitter2);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    mockUsers.clear();
    mockRentals.clear();
    userIdCounter = 1;
    rentalIdCounter = 1;
    jest.restoreAllMocks();
  });

  describe('1. Primary Trial Flow', () => {
    it('should complete full trial activation chain and emit rental.activated event', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      const trialResult = await paymentService.processTrial(telegramId);

      expect(trialResult.success).toBe(true);
      expect(trialResult.rentalId).toBeDefined();

      const user = await usersService.findByTelegramId(telegramId);
      expect(user).toBeDefined();
      expect(user?.telegramId).toEqual(BigInt(telegramId));

      const rental = await rentalsService.getActiveRental(telegramId);
      expect(rental).toBeDefined();
      expect(rental?.status).toBe(RentalStatus.ACTIVE);

      const expectedEndDate = dayjs().add(3, 'day');
      const actualEndDate = dayjs(rental?.endDate);
      expect(actualEndDate.diff(expectedEndDate, 'hour')).toBeLessThan(1);

      expect(emitSpy).toHaveBeenCalledWith(
        'rental.activated',
        expect.objectContaining({
          rentalId: expect.any(Number),
          telegramId: telegramId,
          term: expect.any(Number),
        }),
      );
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Active Extension Flow', () => {
    it('should extend trial preserving remaining time', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      await paymentService.processTrial(telegramId);
      const trialRental = await rentalsService.getActiveRental(telegramId);
      expect(trialRental).toBeDefined();

      const trialEndDate = dayjs(trialRental?.endDate);

      await rentalsService.createPendingRental(telegramId, 1);
      await rentalsService.activateRental(telegramId, chatId);

      const extendedRental = await rentalsService.getActiveRental(telegramId);
      const newEndDate = dayjs(extendedRental?.endDate);

      const expectedNewEndDate = trialEndDate.add(1, 'month');
      expect(newEndDate.diff(expectedNewEndDate, 'hour')).toBeLessThan(1);

      expect(emitSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Update Existing in Panel', () => {
    it('should cumulate term when extending active rental', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      const trialResult = await paymentService.processTrial(telegramId);
      console.log('[TEST 3] trialResult:', trialResult);
      expect(trialResult.success).toBe(true);

      const trialRental = await rentalsService.getActiveRental(telegramId);
      console.log('[TEST 3] trialRental:', trialRental);
      expect(trialRental).toBeDefined();
      const trialTerm = trialRental?.term || 0;
      const trialEndDate = dayjs(trialRental?.endDate);
      console.log(
        '[TEST 3] trialTerm:',
        trialTerm,
        'trialEndDate:',
        trialEndDate.format(),
      );

      const pendingRental = await rentalsService.createPendingRental(
        telegramId,
        1,
      );
      console.log('[TEST 3] pendingRental:', pendingRental);

      const activated = await rentalsService.activateRental(telegramId);
      console.log('[TEST 3] activated:', activated);
      console.log(
        '[TEST 3] mockRentals after activation:',
        Array.from(mockRentals.values()),
      );

      const extendedRental = await rentalsService.getActiveRental(telegramId);
      console.log('[TEST 3] extendedRental:', extendedRental);
      expect(extendedRental).toBeDefined();

      // Term should be cumulated: trial (0.1) + 1 month = ~1.1
      expect(extendedRental?.term).toBeGreaterThan(trialTerm);

      // End date should be extended by 1 month from trial end date
      const newEndDate = dayjs(extendedRental?.endDate);
      const expectedEndDate = trialEndDate.add(1, 'month');
      expect(newEndDate.diff(expectedEndDate, 'hour')).toBeLessThan(1);

      expect(emitSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Extension After Expired', () => {
    it('should start from now when extending expired rental', async () => {
      const user = await usersService.findOrCreate(telegramId);
      const now = dayjs();
      const expiredDate = now.subtract(7, 'day');

      await prisma.rental.create({
        data: {
          userId: user.id,
          term: 1,
          status: RentalStatus.EXPIRED,
          startDate: expiredDate.subtract(1, 'month').toDate(),
          endDate: expiredDate.toDate(),
        },
      });

      await rentalsService.createPendingRental(telegramId, 1);
      await rentalsService.activateRental(telegramId);

      const newRental = await rentalsService.getActiveRental(telegramId);
      const newEndDate = dayjs(newRental?.endDate);

      const expectedEndDate = now.add(1, 'month');
      expect(newEndDate.diff(expectedEndDate, 'hour')).toBeLessThan(1);
    });
  });

  describe('5. Payment Stub Handling', () => {
    it('should return payment unavailable message for paid options', async () => {
      const result = await paymentService.processWeekPayment(telegramId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Оплата временно недоступна');
    });
  });

  describe('6. Resilience & Retry', () => {
    it('should handle rental activation failure gracefully', async () => {
      jest.spyOn(rentalsService, 'activateRental').mockResolvedValue(null);

      const result = await paymentService.processTrial(telegramId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Не удалось активировать');
    });
  });

  describe('7. Transaction Safety', () => {
    it('should activate rental atomically within $transaction', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      await paymentService.processTrial(telegramId);
      console.log(
        '[TEST 7] after processTrial, mockRentals:',
        Array.from(mockRentals.values()),
      );

      const activeRental = await rentalsService.getActiveRental(telegramId);
      console.log('[TEST 7] activeRental:', activeRental);
      expect(activeRental).toBeDefined();

      const pendingRental = await rentalsService.createPendingRental(
        telegramId,
        1,
      );
      console.log('[TEST 7] pendingRental created:', pendingRental);
      console.log(
        '[TEST 7] mockRentals after createPending:',
        Array.from(mockRentals.values()),
      );

      const pendingBefore = Array.from(mockRentals.values()).filter(
        (r: any) => r.status === RentalStatus.PENDING,
      ).length;
      console.log('[TEST 7] pendingBefore:', pendingBefore);
      expect(pendingBefore).toBe(1);

      const result = await rentalsService.activateRental(telegramId);
      console.log('[TEST 7] activateRental result:', result);
      console.log(
        '[TEST 7] mockRentals after activation:',
        Array.from(mockRentals.values()),
      );

      expect(result).not.toBeNull();
      if (result) {
        expect(result.status).toBe(RentalStatus.ACTIVE);
      }

      const pendingAfter = Array.from(mockRentals.values()).filter(
        (r: any) => r.status === RentalStatus.PENDING,
      ).length;
      expect(pendingAfter).toBe(0);

      expect(emitSpy).toHaveBeenCalledWith(
        'rental.activated',
        expect.objectContaining({
          rentalId: expect.any(Number),
          telegramId: telegramId,
          term: expect.any(Number),
        }),
      );
    });
  });
});
