import {
  int,
  mysqlTable,
  varchar,
  uniqueIndex,
  timestamp,
  json,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { Role } from '../common/constans/roles';

export const users = mysqlTable(
  'users',
  {
    id: int('id', { unsigned: true }).primaryKey().autoincrement(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    roles: json('roles').$type<Role[]>().notNull(),
  },
  (table) => [uniqueIndex('idx_user_email_unique').on(table.email)],
);

export const strava_connections = mysqlTable(
  'strava_connections',
  {
    id: int('id', { unsigned: true }).primaryKey().autoincrement(),
    user_id: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    strava_athlete_id: int('strava_athlete_id').notNull(),
    access_token: varchar('access_token', { length: 255 }).notNull(),
    refresh_token: varchar('refresh_token', { length: 255 }).notNull(),
    expires_at: int('expires_at').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_strava_connections_user_id_unique').on(table.user_id),
  ],
);

export const stravaConnectionsRelations = relations(
  strava_connections,
  ({ one }) => ({
    user: one(users, {
      fields: [strava_connections.user_id], // -> foreign key, references to users.id
      references: [users.id],
    }),
  }),
);

export const usersRelations = relations(users, ({ one }) => ({
  stravaConnection: one(strava_connections),
}));
