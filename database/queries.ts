import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';
import { getDatabase } from './init';
import { expenses, settings } from './schema';
import type { NewExpense, Expense } from './schema';

// Add a new expense
export async function addExpense(expense: Omit<NewExpense, 'createdAt' | 'updatedAt'>) {
    const db = getDatabase();
    const now = new Date().toISOString();

    console.log('Database: Adding expense', expense);
    const result = await db
        .insert(expenses)
        .values({
            ...expense,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    console.log('Database: Expense added, result:', result[0]);
    return result[0];
}

// Get all expenses
export async function getAllExpenses() {
    const db = getDatabase();
    const result = await db.select().from(expenses).orderBy(desc(expenses.date));
    console.log('Database: getAllExpenses returned', result.length, 'expenses');
    return result;
}

// Get expenses by date
export async function getExpensesByDate(date: string) {
    const db = getDatabase();
    return await db
        .select()
        .from(expenses)
        .where(eq(expenses.date, date))
        .orderBy(desc(expenses.createdAt));
}

// Get expenses for a date range
export async function getExpensesByDateRange(startDate: string, endDate: string) {
    const db = getDatabase();
    return await db
        .select()
        .from(expenses)
        .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)))
        .orderBy(desc(expenses.date));
}

// Get expenses by category
export async function getExpensesByCategory(category: string) {
    const db = getDatabase();
    return await db
        .select()
        .from(expenses)
        .where(eq(expenses.category, category))
        .orderBy(desc(expenses.date));
}

// Get total expense for a date
export async function getTotalExpenseForDate(date: string) {
    const db = getDatabase();
    const result = await db
        .select({
            total: sql<number>`SUM(${expenses.value})`,
        })
        .from(expenses)
        .where(eq(expenses.date, date));

    return result[0]?.total || 0;
}

// Get total expense for date range
export async function getTotalExpenseForDateRange(startDate: string, endDate: string) {
    const db = getDatabase();
    const result = await db
        .select({
            total: sql<number>`SUM(${expenses.value})`,
        })
        .from(expenses)
        .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)));

    return result[0]?.total || 0;
}

// Get expenses grouped by category for a date range
export async function getExpensesByCategoryForRange(startDate: string, endDate: string) {
    const db = getDatabase();
    return await db
        .select({
            category: expenses.category,
            total: sql<number>`SUM(${expenses.value})`,
            count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)))
        .groupBy(expenses.category);
}

// Update an expense
export async function updateExpense(id: number, updates: Partial<Omit<NewExpense, 'createdAt'>>) {
    const db = getDatabase();
    const now = new Date().toISOString();

    const result = await db
        .update(expenses)
        .set({
            ...updates,
            updatedAt: now,
        })
        .where(eq(expenses.id, id))
        .returning();

    return result[0];
}

// Delete an expense
export async function deleteExpense(id: number) {
    const db = getDatabase();
    await db.delete(expenses).where(eq(expenses.id, id));
}

// Delete all expenses for a date
export async function deleteExpensesForDate(date: string) {
    const db = getDatabase();
    await db.delete(expenses).where(eq(expenses.date, date));
}

// --- Settings queries ---

// Get setting by key
export async function getSetting(key: string): Promise<string | null> {
    const db = getDatabase();
    const result = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

    return result[0]?.value || null;
}

// Set setting
export async function setSetting(key: string, value: string) {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

    if (existing.length > 0) {
        // Update existing
        await db
            .update(settings)
            .set({ value, updatedAt: now })
            .where(eq(settings.key, key));
    } else {
        // Insert new
        await db
            .insert(settings)
            .values({ key, value, updatedAt: now });
    }
}

// Get monthly budget
export async function getMonthlyBudget(): Promise<number | null> {
    const value = await getSetting('monthly_budget');
    return value ? parseFloat(value) : null;
}

// Set monthly budget
export async function setMonthlyBudget(budget: number) {
    await setSetting('monthly_budget', budget.toString());
}
