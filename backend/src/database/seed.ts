import * as argon2 from 'argon2';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { users } from './schema';
import { Role } from '../modules/auth/roles';

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

    await db.insert(users).values([
      {
        email: 'user@stridewise.local',
        firstName: 'Regular',
        lastName: 'User',
        passwordHash: await hashPassword('User123!'),
        roles: [Role.USER],
      },
      {
        email: 'admin@stridewise.local',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: await hashPassword('Admin123!'),
        roles: [Role.ADMIN],
      },
    ]);

    console.log('Seed complete.');
    console.log('User: user@stridewise.local / User123!');
    console.log('Admin: admin@stridewise.local / Admin123!');
  } finally {
    await pool.end();
  }
}

void seed();
