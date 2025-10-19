
import { relations } from "drizzle-orm";
import { users, stories } from "../../shared/schema";

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	stories: many(stories),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
	author: one(users, {
		fields: [stories.authorId],
		references: [users.id],
	}),
}));
