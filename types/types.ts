export interface ReportData {
    todaysDate: string;
    totalExpense: string;
    month: string;
    all: list[];
    time: string;
}

export interface input {
    id?: string;
    name: string;
    category: string;
    value?: number;
}

export type list = {
    id?: string;
    name: string;
    value: number;
    category: string;
};

export type ExpenseCategory =
    | 'food'
    | 'transport'
    | 'shopping'
    | 'entertainment'
    | 'bills'
    | 'health'
    | 'education'
    | 'other';

export interface ReportItem {
    name: string;
    value: number | string;
}
export interface ReportDataEntry {
    todaysDate: string;
    totalGrossIncome: string;
    calculatedNetIncome: string;
    month: string;
    all: ReportItem[];
    time: string;
}