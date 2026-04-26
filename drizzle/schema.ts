import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, varchar, int, text, primaryKey, datetime, double, unique } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const account = mysqlTable("account", {
	userId: varchar({ length: 191 }).notNull().references(() => user.id, { onDelete: "cascade" } ),
	type: varchar({ length: 191 }).notNull(),
	provider: varchar({ length: 191 }).notNull(),
	providerAccountId: varchar({ length: 191 }).notNull(),
	refreshToken: varchar("refresh_token", { length: 255 }),
	accessToken: varchar("access_token", { length: 255 }),
	expiresAt: int("expires_at"),
	tokenType: varchar("token_type", { length: 191 }),
	scope: varchar({ length: 191 }),
	idToken: text("id_token"),
	sessionState: varchar("session_state", { length: 191 }),
},
(table) => [
	index("userId").on(table.userId),
]);

export const guestid = mysqlTable("guestid", {
	id: varchar({ length: 191 }).notNull(),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("GuestId_createdAt_idx").on(table.createdAt),
	primaryKey({ columns: [table.id], name: "guestid_id"}),
]);

export const map = mysqlTable("map", {
	id: varchar({ length: 191 }).notNull(),
	nameZh: varchar({ length: 191 }),
	nameEn: varchar({ length: 191 }),
	description: text(),
	images: text().notNull(),
	submitterId: varchar({ length: 191 }).notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	averageRating: double().notNull(),
	ratingCount: int().default(0).notNull(),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("Map_averageRating_idx").on(table.averageRating),
	index("Map_createdAt_idx").on(table.createdAt),
	index("Map_submitterId_idx").on(table.submitterId),
	primaryKey({ columns: [table.id], name: "map_id"}),
]);

export const rating = mysqlTable("rating", {
	id: varchar({ length: 191 }).notNull(),
	score: int().notNull(),
	comment: text(),
	mapId: varchar({ length: 191 }).notNull().references(() => map.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userId: varchar({ length: 191 }).references(() => user.id, { onDelete: "set null", onUpdate: "cascade" } ),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	guestId: varchar({ length: 191 }),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	index("Rating_guestId_idx").on(table.guestId),
	index("Rating_mapId_idx").on(table.mapId),
	index("Rating_userId_idx").on(table.userId),
	primaryKey({ columns: [table.id], name: "rating_id"}),
	unique("Rating_mapId_userId_key").on(table.mapId, table.userId),
]);

export const session = mysqlTable("session", {
	sessionToken: varchar({ length: 191 }).notNull(),
	userId: varchar({ length: 191 }).notNull().references(() => user.id, { onDelete: "cascade" } ),
	expires: datetime({ mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	index("userId").on(table.userId),
	primaryKey({ columns: [table.sessionToken], name: "session_sessionToken"}),
]);

export const user = mysqlTable("user", {
	id: varchar({ length: 191 }).notNull(),
	steamId: varchar({ length: 191 }),
	name: varchar({ length: 191 }),
	avatar: varchar({ length: 191 }),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	email: varchar({ length: 191 }),
	emailVerified: datetime({ mode: 'string', fsp: 3 }),
},
(table) => [
	index("User_steamId_idx").on(table.steamId),
	primaryKey({ columns: [table.id], name: "user_id"}),
	unique("User_email_unique").on(table.email),
	unique("User_steamId_key").on(table.steamId),
]);

export const verificationtoken = mysqlTable("verificationtoken", {
	identifier: varchar({ length: 191 }).notNull(),
	token: varchar({ length: 191 }).notNull(),
	expires: datetime({ mode: 'string', fsp: 3 }).notNull(),
});
