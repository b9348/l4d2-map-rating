import { mysqlTable, varchar, text, int, double, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// 字段 JS key 必须与 NextAuth DrizzleAdapter 期望一致:id/name/email/emailVerified/image
// 其中 `image` 底层 SQL 列名保留为 `avatar`,避免历史数据迁移
export const users = mysqlTable('User', {
  id: varchar('id', { length: 191 }).primaryKey(),
  steamId: varchar('steamId', { length: 191 }).unique(),
  name: varchar('name', { length: 191 }),
  email: varchar('email', { length: 191 }).unique(),
  emailVerified: datetime('emailVerified', { fsp: 3 }),
  image: varchar('avatar', { length: 191 }),
  createdAt: datetime('createdAt', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
  updatedAt: datetime('updatedAt', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  steamIdIdx: index('User_steamId_idx').on(table.steamId),
}));

// NextAuth required tables
export const accounts = mysqlTable('Account', {
  userId: varchar('userId', { length: 191 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 191 }).notNull(),
  provider: varchar('provider', { length: 191 }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 191 }).notNull(),
  refresh_token: varchar('refresh_token', { length: 255 }),
  access_token: varchar('access_token', { length: 255 }),
  expires_at: int('expires_at'),
  token_type: varchar('token_type', { length: 191 }),
  scope: varchar('scope', { length: 191 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 191 }),
});

export const sessions = mysqlTable('Session', {
  sessionToken: varchar('sessionToken', { length: 191 }).primaryKey(),
  userId: varchar('userId', { length: 191 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: datetime('expires', { fsp: 3 }).notNull(),
});

export const verificationTokens = mysqlTable('VerificationToken', {
  identifier: varchar('identifier', { length: 191 }).notNull(),
  token: varchar('token', { length: 191 }).notNull(),
  expires: datetime('expires', { fsp: 3 }).notNull(),
});

export const maps = mysqlTable('Map', {
  id: varchar('id', { length: 191 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  nameZh: varchar('nameZh', { length: 191 }),
  nameEn: varchar('nameEn', { length: 191 }),
  description: text('description'),
  images: text('images').notNull(), // JSON string
  submitterId: varchar('submitterId', { length: 191 }).notNull(),
  averageRating: double('averageRating').default(0).notNull(),
  ratingCount: int('ratingCount').default(0).notNull(),
  createdAt: datetime('createdAt', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
  updatedAt: datetime('updatedAt', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  submitterIdx: index('Map_submitterId_idx').on(table.submitterId),
  createdAtIdx: index('Map_createdAt_idx').on(table.createdAt),
  ratingIdx: index('Map_averageRating_idx').on(table.averageRating),
}));

export const guestIds = mysqlTable('GuestId', {
  id: varchar('id', { length: 191 }).primaryKey(),
  createdAt: datetime('createdAt', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
}, (table) => ({
  createdAtIdx: index('GuestId_createdAt_idx').on(table.createdAt),
}));

export const ratings = mysqlTable('Rating', {
  id: varchar('id', { length: 191 }).primaryKey(),
  score: int('score').notNull(),
  comment: text('comment'),
  mapId: varchar('mapId', { length: 191 }).notNull(),
  userId: varchar('userId', { length: 191 }),
  guestId: varchar('guestId', { length: 191 }),
  createdAt: datetime('createdAt', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
  updatedAt: datetime('updatedAt', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => ({
  mapIdx: index('Rating_mapId_idx').on(table.mapId),
  userIdx: index('Rating_userId_idx').on(table.userId),
  guestIdx: index('Rating_guestId_idx').on(table.guestId),
}));
