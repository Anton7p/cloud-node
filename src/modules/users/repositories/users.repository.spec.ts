import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository, CreateUserData } from './users.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockPrisma = any;

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockPrisma: MockPrisma;

  const mockUser = {
    id: 1,
    telegramId: BigInt(123456789),
    username: 'testuser',
    firstName: 'Test',
    status: 'active',
    subscriptionType: 'free',
    balance: { toNumber: () => 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: null,
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with default values', async () => {
      const createData: CreateUserData = {
        telegramId: 123456789,
        username: 'testuser',
        firstName: 'Test',
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.create(createData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          telegramId: BigInt(123456789),
          username: 'testuser',
          firstName: 'Test',
          status: 'active',
          subscriptionType: 'free',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create user with provided status and subscription', async () => {
      const createData: CreateUserData = {
        telegramId: 123456789,
        status: 'expired',
        subscriptionType: 'premium',
      };

      const premiumUser = {
        ...mockUser,
        subscriptionType: 'premium',
        status: 'expired',
      };
      mockPrisma.user.create.mockResolvedValue(premiumUser);

      await repository.create(createData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'expired',
          subscriptionType: 'premium',
        }),
      });
    });
  });

  describe('findByTelegramId', () => {
    it('should find user by telegramId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByTelegramId(123456789);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByTelegramId(999999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 2 }];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await repository.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update user when exists', async () => {
      const updates = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, firstName: 'Updated' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update(123456789, updates);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        data: updates,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.update(999999, { firstName: 'Updated' });

      expect(result).toBeNull();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('touch', () => {
    it('should update updatedAt timestamp', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repository.touch(123456789);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        data: { updatedAt: expect.any(Date) },
      });
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(30);

      const stats = await repository.getStats();

      expect(stats).toEqual({
        total: 100,
        active: 80,
        expired: 20,
        free: 70,
        premium: 30,
      });
    });
  });
});
