# Expo SQLite + Drizzle Database Setup

## Overview

This database setup uses **expo-sqlite** with **Drizzle ORM** to manage user expenses for the CALCU app. All expense data is stored locally on the device.

## Files Structure

- **`schema.ts`** - Drizzle schema definition for the expenses table
- **`init.ts`** - Database initialization and connection
- **`queries.ts`** - All database query operations
- **`../hooks/useExpenses.ts`** - React hook for managing expenses in components

## Installation

Packages have been installed:

- `expo-sqlite` - SQLite database for React Native
- `drizzle-orm` - Type-safe ORM
- `drizzle-kit` - Drizzle utilities

## Setup

### 1. Initialize Database in Your Root Layout

In your app entry point or root layout file (e.g., `app/_layout.tsx`):

```typescript
import { initializeDatabase } from "@/database/init";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    initializeDatabase().catch((error) => {
      console.error("Failed to initialize database:", error);
    });
  }, []);

  // Rest of your layout...
}
```

## Usage

### Basic Usage with Hook

```typescript
import { useExpenses } from '@/hooks/useExpenses';

export default function ExpenseScreen() {
  const {
    expenses,
    loading,
    addExpense,
    loadExpenses,
    getTotalForDate,
    deleteExpenseItem,
  } = useExpenses();

  // Load expenses on mount
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Add new expense
  const handleAddExpense = async () => {
    await addExpense({
      name: 'Lunch',
      category: 'food',
      value: 12.50,
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Get total for today
  const handleGetTotal = async () => {
    const today = new Date().toISOString().split('T')[0];
    const total = await getTotalForDate(today);
    console.log('Total:', total);
  };

  return (
    // Your component JSX...
  );
}
```

## Available Query Functions

### Add & Modify

- **`addExpense(expense)`** - Add a new expense
- **`updateExpense(id, updates)`** - Update an expense
- **`deleteExpense(id)`** - Delete a specific expense
- **`deleteExpensesForDate(date)`** - Delete all expenses for a date

### Retrieve Data

- **`getAllExpenses()`** - Get all expenses (ordered by date)
- **`getExpensesByDate(date)`** - Get expenses for a specific date
- **`getExpensesByDateRange(startDate, endDate)`** - Get expenses in a date range
- **`getExpensesByCategory(category)`** - Get all expenses of a category

### Analytics

- **`getTotalExpenseForDate(date)`** - Sum of expenses for a date
- **`getTotalExpenseForDateRange(startDate, endDate)`** - Sum for date range
- **`getExpensesByCategoryForRange(startDate, endDate)`** - Grouped by category with totals

## Expense Object Structure

```typescript
interface Expense {
  id: number;
  name: string;
  category: string; // 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other'
  value: number;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

## Hook Return Type

```typescript
interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: Error | null;
  addExpense: (expense: ...) => Promise<Expense | undefined>;
  loadExpenses: () => Promise<void>;
  loadExpensesByDate: (date: string) => Promise<void>;
  loadExpensesByDateRange: (startDate: string, endDate: string) => Promise<void>;
  loadExpensesByCategory: (category: string) => Promise<void>;
  getTotalForDate: (date: string) => Promise<number>;
  getTotalForDateRange: (startDate: string, endDate: string) => Promise<number>;
  getByCategory: (startDate: string, endDate: string) => Promise<CategoryData[]>;
  updateExpenseItem: (id: number, updates: ...) => Promise<Expense | undefined>;
  deleteExpenseItem: (id: number) => Promise<void>;
  deleteExpensesForSpecificDate: (date: string) => Promise<void>;
}
```

## Best Practices

1. **Initialize on App Start** - Call `initializeDatabase()` in your root layout
2. **Use the Hook** - Use `useExpenses()` hook in components for state management
3. **Date Format** - Always use ISO 8601 format (YYYY-MM-DD) for dates
4. **Error Handling** - Check the `error` state in the hook
5. **Loading State** - Use the `loading` state to show spinners during operations

## Example: Complete Expense Tracker

```typescript
import { useExpenses } from '@/hooks/useExpenses';
import { useEffect, useState } from 'react';

export default function ExpenseTracker() {
  const {
    expenses,
    loading,
    addExpense,
    loadExpenses,
    getTotalForDate,
    deleteExpenseItem,
  } = useExpenses();

  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    getTotalForDate(today).then(setTotalToday);
  }, [expenses]);

  const handleAddExpense = async (name: string, category: string, value: number) => {
    await addExpense({
      name,
      category,
      value,
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    // Your UI here
  );
}
```

## Notes

- Data is stored locally on the device
- No network calls needed
- Database persists across app sessions
- SQLite queries are synchronous, wrapped in async functions for consistency
