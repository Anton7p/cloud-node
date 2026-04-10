import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
