import { useCallback, useState } from 'react';
import type { Expense } from '@/database/schema';
import {
    addExpense,
    getAllExpenses,
    getExpensesByDate,
    getExpensesByDateRange,
    getExpensesByCategory,
    getTotalExpenseForDate,
    getTotalExpenseForDateRange,
    getExpensesByCategoryForRange,
    updateExpense,
    deleteExpense,
    deleteExpensesForDate,
} from '@/database/queries';

export interface UseExpensesReturn {
    expenses: Expense[];
    loading: boolean;
    error: Error | null;
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense | undefined>;
    loadExpenses: () => Promise<Expense[]>;
    loadExpensesByDate: (date: string) => Promise<void>;
    loadExpensesByDateRange: (startDate: string, endDate: string) => Promise<void>;
    loadExpensesByCategory: (category: string) => Promise<void>;
    getTotalForDate: (date: string) => Promise<number>;
    getTotalForDateRange: (startDate: string, endDate: string) => Promise<number>;
    getByCategory: (startDate: string, endDate: string) => Promise<any[]>;
    updateExpenseItem: (id: number, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<Expense | undefined>;
    deleteExpenseItem: (id: number) => Promise<void>;
    deleteExpensesForSpecificDate: (date: string) => Promise<void>;
}

export function useExpenses(): UseExpensesReturn {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAllExpenses();
            setExpenses(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const loadExpensesByDate = useCallback(async (date: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getExpensesByDate(date);
            setExpenses(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadExpensesByDateRange = useCallback(async (startDate: string, endDate: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getExpensesByDateRange(startDate, endDate);
            setExpenses(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadExpensesByCategory = useCallback(async (category: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getExpensesByCategory(category);
            setExpenses(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAddExpense = useCallback(
        async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
            setError(null);
            try {
                const newExpense = await addExpense(expense);
                if (newExpense) {
                    setExpenses((prev) => [newExpense, ...prev]);
                }
                return newExpense;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to add expense');
                setError(error);
                throw error;
            }
        },
        []
    );

    const getTotalForDate = useCallback(async (date: string) => {
        try {
            return await getTotalExpenseForDate(date);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to get total'));
            return 0;
        }
    }, []);

    const getTotalForDateRange = useCallback(async (startDate: string, endDate: string) => {
        try {
            return await getTotalExpenseForDateRange(startDate, endDate);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to get total'));
            return 0;
        }
    }, []);

    const getByCategory = useCallback(async (startDate: string, endDate: string) => {
        try {
            return await getExpensesByCategoryForRange(startDate, endDate);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to get category data'));
            return [];
        }
    }, []);

    const handleUpdateExpense = useCallback(async (id: number, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
        setError(null);
        try {
            const updated = await updateExpense(id, updates);
            if (updated) {
                setExpenses((prev) => prev.map((exp) => (exp.id === id ? updated : exp)));
            }
            return updated;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update expense');
            setError(error);
            throw error;
        }
    }, []);

    const handleDeleteExpense = useCallback(async (id: number) => {
        setError(null);
        try {
            await deleteExpense(id);
            setExpenses((prev) => prev.filter((exp) => exp.id !== id));
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete expense');
            setError(error);
            throw error;
        }
    }, []);

    const handleDeleteExpensesForDate = useCallback(async (date: string) => {
        setError(null);
        try {
            await deleteExpensesForDate(date);
            setExpenses((prev) => prev.filter((exp) => exp.date !== date));
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete expenses');
            setError(error);
            throw error;
        }
    }, []);

    return {
        expenses,
        loading,
        error,
        addExpense: handleAddExpense,
        loadExpenses,
        loadExpensesByDate,
        loadExpensesByDateRange,
        loadExpensesByCategory,
        getTotalForDate,
        getTotalForDateRange,
        getByCategory,
        updateExpenseItem: handleUpdateExpense,
        deleteExpenseItem: handleDeleteExpense,
        deleteExpensesForSpecificDate: handleDeleteExpensesForDate,
    };
}
