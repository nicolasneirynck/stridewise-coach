import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { DatabaseConfig, ServerConfig } from '../config/configuration';
import { Inject } from '@nestjs/common';
import * as schema from './schema';
import { MySql2Database } from 'drizzle-orm/mysql2';

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';
export const InjectDrizzle = () => Inject(DrizzleAsyncProvider);

export type DatabaseProvider = MySql2Database<typeof schema> & {
  $client: mysql.Pool;
};

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: (configService: ConfigService<ServerConfig>) => {
      const databaseConfig = configService.get<DatabaseConfig>('database')!;
      return drizzle({
        client: mysql.createPool({
          uri: databaseConfig.url,
          connectionLimit: 5,
        }),
        mode: 'default',
        schema,
      });
    },
  },
];
