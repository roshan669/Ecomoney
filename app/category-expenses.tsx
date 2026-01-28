import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { HomeContext } from "@/hooks/useHome";
import { useExpenses } from "@/hooks/useExpenses";
import { getCategoryColor, getCategoryIcon } from "@/constants/categories";

interface CategoryExpenseItem {
  id?: number;
  name: string;
  value: number;
  date: string;
  category: string;
}

const CategoryExpenseRow = ({
  item,
  currencySymbol,
  themeColors,
}: {
  item: CategoryExpenseItem;
  currencySymbol: string;
  themeColors: any;
}) => {
  const color = getCategoryColor(item.category);
  const icon = getCategoryIcon(item.category);

  return (
    <View style={[styles.rowContainer, { borderColor: themeColors.border }]}>
      <View style={[styles.rowIconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.rowInfo}>
        <Text
          style={[styles.rowName, { color: themeColors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.rowMeta, { color: themeColors.subText }]}>
          {item.date}
        </Text>
      </View>
      <View
        style={[
          styles.rowAmountBox,
          {
            borderColor: themeColors.border,
            backgroundColor: themeColors.card,
          },
        ]}
      >
        <Text style={[styles.rowCurrency, { color: themeColors.subText }]}>
          {currencySymbol}
        </Text>
        <Text style={[styles.rowAmount, { color: themeColors.text }]}>
          {item.value.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

export default function CategoryExpensesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    period?: string;
  }>();

  const rawCategory = (params.category || "other").toString();
  const period = (params.period || "All Time").toString();

  const categoryKey = rawCategory.toLowerCase();
  const categoryTitle =
    categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

  const { themeColors, currencySymbol } = useContext(HomeContext);
  const { loadExpenses } = useExpenses();

  const [items, setItems] = useState<CategoryExpenseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCategoryExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const all = await loadExpenses();

      let filtered = all.filter(
        (exp) => (exp.category || "other").toLowerCase() === categoryKey,
      );

      if (period !== "All Time") {
        const [monthStr, yearStr] = period.split(" ");
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthIndex = monthNames.indexOf(monthStr);
        const year = parseInt(yearStr, 10);

        if (monthIndex !== -1 && !Number.isNaN(year)) {
          const startDate = new Date(year, monthIndex, 1)
            .toISOString()
            .split("T")[0];
          const endDate = new Date(year, monthIndex + 1, 0)
            .toISOString()
            .split("T")[0];

          filtered = filtered.filter(
            (exp) => exp.date >= startDate && exp.date <= endDate,
          );
        }
      }

      const mapped: CategoryExpenseItem[] = filtered.map((exp) => ({
        id: exp.id,
        name: exp.name,
        value: exp.value,
        date: exp.date,
        category: exp.category,
      }));

      setItems(mapped);
    } catch (e) {
      console.error("Failed to load category expenses", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryKey, period, loadExpenses]);

  useEffect(() => {
    loadCategoryExpenses();
  }, [loadCategoryExpenses]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.value || 0), 0),
    [items],
  );

  const periodLabel = period === "All Time" ? "All Time" : period;

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {categoryTitle}
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.subText }]}>
            {periodLabel}
          </Text>
        </View>
      </View>

      {/* Summary */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.summaryLeft}>
          <View
            style={[
              styles.summaryIconBox,
              { backgroundColor: `${getCategoryColor(categoryKey)}15` },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(categoryKey)}
              size={22}
              color={getCategoryColor(categoryKey)}
            />
          </View>
          <View>
            <Text style={[styles.summaryLabel, { color: themeColors.subText }]}>
              Total Spent
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.text }]}>
              {currencySymbol}
              {total.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRight}>
          <Text style={[styles.summaryCount, { color: themeColors.text }]}>
            {items.length}
          </Text>
          <Text
            style={[styles.summaryCountLabel, { color: themeColors.subText }]}
          >
            {items.length === 1 ? "Expense" : "Expenses"}
          </Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loadingText, { color: themeColors.subText }]}>
            Loading expenses...
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="file-tray-outline"
            size={56}
            color={themeColors.subText}
          />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            No expenses found
          </Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
            There are no expenses for this category in the selected period.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : `${item.name}-${index}`
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CategoryExpenseRow
              item={item}
              currencySymbol={currencySymbol}
              themeColors={themeColors}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerTitles: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCountLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  rowAmountBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  rowCurrency: {
    fontSize: 12,
    marginRight: 4,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
