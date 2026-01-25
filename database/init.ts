import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export async function initializeDatabase() {
    try {
        const sqlite = await SQLite.openDatabaseAsync('calcu.db');

        db = drizzle(sqlite, { schema });

        // Create tables if they don't exist
        await sqlite.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        value REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    `);

        console.log('Database initialized successfully');
        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}
