import { relations } from "drizzle-orm/relations";
import { user, account, map, rating, session } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	maps: many(map),
	ratings: many(rating),
	sessions: many(session),
}));

export const mapRelations = relations(map, ({one, many}) => ({
	user: one(user, {
		fields: [map.submitterId],
		references: [user.id]
	}),
	ratings: many(rating),
}));

export const ratingRelations = relations(rating, ({one}) => ({
	map: one(map, {
		fields: [rating.mapId],
		references: [map.id]
	}),
	user: one(user, {
		fields: [rating.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));