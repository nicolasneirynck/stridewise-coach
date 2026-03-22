import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../../database/drizzle.module';

@Module({
  imports: [AuthModule, DrizzleModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
