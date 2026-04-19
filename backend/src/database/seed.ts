import * as argon2 from 'argon2';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { users } from './schema';
import { Role } from '../common/constans/roles';

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    hashLength: 32,
    timeCost: 2,
    memoryCost: 2 ** 16,
  });
}

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 1,
  });

  const db = drizzle(pool, { mode: 'default' });

  try {
    console.log('Seeding users...');

    await db
      .insert(users)
      .values([
        {
          email: 'user@stridewise.local',
          firstName: 'Regular',
          lastName: 'User',
          passwordHash: await hashPassword('User123!'),
          roles: [Role.USER],
          maxHeartRate: 188,
          restingHeartRate: 56,
        },
        {
          email: 'admin@stridewise.local',
          firstName: 'Admin',
          lastName: 'User',
          passwordHash: await hashPassword('Admin123!'),
          roles: [Role.ADMIN],
          maxHeartRate: 188,
          restingHeartRate: 56,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          passwordHash: sql`values(password_hash)`,
          firstName: sql`values(first_name)`,
          lastName: sql`values(last_name)`,
          roles: sql`values(roles)`,
          maxHeartRate: sql`values(max_heart_rate)`,
        },
      });

    console.log('Seed complete.');
    console.log('User: user@stridewise.local / User123!');
    console.log('Admin: admin@stridewise.local / Admin123!');
  } finally {
    await pool.end();
  }
}

void seed();
