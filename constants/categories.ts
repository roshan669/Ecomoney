import { Ionicons } from "@expo/vector-icons";
import { ExpenseCategory } from "@/types/types";

// Currencies
export const currencies = ["$", "₹", "€", "£", "¥"];

export const categoryColors: Record<string, string> = {
    food: "#F59E0B", // Amber
    transport: "#3B82F6", // Blue
    shopping: "#EC4899", // Pink
    entertainment: "#8B5CF6", // Violet
    bills: "#10B981", // Emerald
    health: "#EF4444", // Red
    education: "#06B6D4", // Cyan
    other: "#6B7280", // Gray
};

export const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    food: "fast-food-outline",
    transport: "car-outline",
    shopping: "bag-handle-outline",
    entertainment: "game-controller-outline",
    bills: "receipt-outline",
    health: "fitness-outline",
    education: "school-outline",
    other: "grid-outline",
};

export const getCategoryColor = (category: string) => {
    return categoryColors[category?.toLowerCase()] || "#6B7280";
};

export const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    return categoryIcons[category?.toLowerCase()] || "grid-outline";
};

export const expenseCategoriesList: { key: ExpenseCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "food", label: "Food", icon: "fast-food-outline" },
    { key: "transport", label: "Transport", icon: "car-outline" },
    { key: "shopping", label: "Shopping", icon: "bag-handle-outline" },
    { key: "entertainment", label: "Entertainment", icon: "game-controller-outline" },
    { key: "bills", label: "Bills", icon: "receipt-outline" },
    { key: "health", label: "Health", icon: "fitness-outline" },
    { key: "education", label: "Education", icon: "school-outline" },
    { key: "other", label: "Other", icon: "grid-outline" },
];
