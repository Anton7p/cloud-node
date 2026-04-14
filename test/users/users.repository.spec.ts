import { Test, TestingModule } from '@nestjs/testing';
import {
  UsersRepository,
  CreateUserData,
} from '../../src/modules/users/repositories/users.repository';
import { PrismaService } from '../../src/shared/prisma/prisma.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              upsert: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('BigInt Validation', () => {
    it('should handle extremely large telegramId without precision loss', async () => {
      const largeTelegramId = 9223372036854775807n; // Max safe BigInt
      const userData: CreateUserData = {
        telegramId: Number(largeTelegramId),
        username: 'testuser',
        firstName: 'Test',
      };

      const expectedUser = {
        id: 1,
        telegramId: largeTelegramId,
        username: 'testuser',
        firstName: 'Test',
        status: 'active',
        subscriptionType: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(expectedUser as any);

      const result = await repository.create(userData);

      expect(result.telegramId).toEqual(largeTelegramId);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          telegramId: BigInt(userData.telegramId),
        }),
      });
    });

    it('should convert telegramId to BigInt in upsert', async () => {
      const telegramId = 123456789012345;
      const userData: CreateUserData = {
        telegramId,
        username: 'testuser',
      };

      const expectedUser = {
        id: 1,
        telegramId: BigInt(telegramId),
        username: 'testuser',
        status: 'active',
        subscriptionType: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.user, 'upsert')
        .mockResolvedValue(expectedUser as any);

      await repository.upsert(userData);

      expect(prismaService.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { telegramId: BigInt(telegramId) },
        }),
      );
    });
  });

  describe('Upsert Atomicity', () => {
    it('should prevent duplicate creation with concurrent upserts', async () => {
      const telegramId = 123456789;
      const userData: CreateUserData = {
        telegramId,
        username: 'testuser',
      };

      const expectedUser = {
        id: 1,
        telegramId: BigInt(telegramId),
        username: 'testuser',
        status: 'active',
        subscriptionType: 'free',
      };

      jest
        .spyOn(prismaService.user, 'upsert')
        .mockResolvedValue(expectedUser as any);

      // Simulate concurrent calls
      const promises = [
        repository.upsert(userData),
        repository.upsert(userData),
        repository.upsert(userData),
      ];

      const results = await Promise.all(promises);

      // All should return the same user
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.telegramId).toEqual(BigInt(telegramId));
      });

      // Prisma upsert should be called for each concurrent request
      expect(prismaService.user.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('Update without preliminary check', () => {
    it('should handle update for non-existent user gracefully', async () => {
      const telegramId = 999999999;

      jest.spyOn(prismaService.user, 'update').mockRejectedValue({
        code: 'P2025',
        message: 'Record to update does not exist',
      });

      const result = await repository.update(telegramId, {
        username: 'newname',
      });

      expect(result).toBeNull();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { telegramId: BigInt(telegramId) },
        data: { username: 'newname' },
      });
    });
  });
});
