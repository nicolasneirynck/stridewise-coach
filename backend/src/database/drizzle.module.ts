import { Module, OnModuleDestroy } from '@nestjs/common';
import {
  type DatabaseProvider,
  DrizzleAsyncProvider,
  drizzleProvider,
  InjectDrizzle,
} from './drizzle.provider';

@Module({
  providers: [...drizzleProvider],
  exports: [DrizzleAsyncProvider],
})
export class DrizzleModule implements OnModuleDestroy {
  constructor(@InjectDrizzle() private readonly db: DatabaseProvider) {}

  async onModuleDestroy() {
    await this.db.$client.end();
  }
}
