import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicUserResponseDTO } from './users.dto';
import { plainToInstance } from 'class-transformer';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';

@Injectable()
export class UserService {
  constructor(
    @InjectDrizzle()
    private readonly db: DatabaseProvider,
  ) {}

  async getById(id: number): Promise<PublicUserResponseDTO> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException(`No user with this id exists`);
    }

    return plainToInstance(PublicUserResponseDTO, user, {
      // plainToInstance: transform user object to DTO
      // excludeExtraneousValues -> only @Expose() fields
      excludeExtraneousValues: true,
    });
  }
}
