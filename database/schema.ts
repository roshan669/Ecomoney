import { integer, real, text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable('expenses', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    value: real('value').notNull(),
    date: text('date').notNull(), // ISO 8601 format
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    updatedAt: text('updated_at').notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
