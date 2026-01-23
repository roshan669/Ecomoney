import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Table, Row } from "react-native-table-component";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { PieChart as GiftedPieChart } from "react-native-gifted-charts";
import type { ReportData } from "@/types/types";
import Menu from "@/components/Menu.modal";

// --- Components ---

// 1. Month Pill
const MonthPill = ({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.monthPill, isSelected && styles.monthPillSelected]}
    activeOpacity={0.7}
  >
    <Text
      style={[styles.monthPillText, isSelected && styles.monthPillTextSelected]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// 2. Summary Card
const SummaryCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) => (
  <View style={styles.summaryCardContainer}>
    <View style={styles.summaryCardContent}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.summaryLabel}>{title}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  </View>
);

// 3. Segmented Control
const ViewSegmentControl = ({
  selected,
  onSelect,
}: {
  selected: "chart" | "table";
  onSelect: (v: "chart" | "table") => void;
}) => (
  <View style={styles.segmentContainer}>
    <TouchableOpacity
      style={[
        styles.segmentButton,
        selected === "chart" && styles.segmentButtonActive,
      ]}
      onPress={() => onSelect("chart")}
    >
      <Ionicons
        name="pie-chart"
        size={18}
        color={selected === "chart" ? "#4F46E5" : "#6B7280"}
      />
      <Text
        style={[
          styles.segmentText,
          selected === "chart" && styles.segmentTextActive,
        ]}
      >
        Analysis
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.segmentButton,
        selected === "table" && styles.segmentButtonActive,
      ]}
      onPress={() => onSelect("table")}
    >
      <Ionicons
        name="list"
        size={18}
        color={selected === "table" ? "#4F46E5" : "#6B7280"}
      />
      <Text
        style={[
          styles.segmentText,
          selected === "table" && styles.segmentTextActive,
        ]}
      >
        Records
      </Text>
    </TouchableOpacity>
  </View>
);

export default function Report() {
  // --- State ---
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [selectedMonthTitle, setSelectedMonthTitle] =
    useState<string>("Select Month");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refs
  const isMounted = useRef(true);

  const getAllMonthKeys = useCallback(async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const monthKeys = keys
        .filter((key) => key !== "perfer" && /^[A-Za-z]{3} \d{4}$/.test(key))
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      return monthKeys;
    } catch (_error) {
      return [];
    }
  }, []);

  const loadReportData = useCallback(async (month: string) => {
    if (!isMounted.current) return;
    setIsLoading(true);

    try {
      const storedData = await AsyncStorage.getItem(month);
      if (isMounted.current && storedData) {
        const parsedData = JSON.parse(storedData);
        setReportData(parsedData);
        setSelectedMonthTitle(month);
      } else if (isMounted.current) {
        setReportData([]);
        setSelectedMonthTitle(month);
      }
    } catch (_e) {
      console.error(_e);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setIsLoading(true);
        const keys = await getAllMonthKeys();
        if (isMounted.current) {
          setAllMonths(keys);
          if (keys.length > 0) {
            // If already on a valid month, invoke load for it, else load last
            const target =
              selectedMonthTitle !== "Select Month" &&
              keys.includes(selectedMonthTitle)
                ? selectedMonthTitle
                : keys[keys.length - 1];
            loadReportData(target);
          } else {
            setIsLoading(false);
            setReportData([]);
            setSelectedMonthTitle("Select Month");
          }
        }
      };
      init();
    }, [getAllMonthKeys, loadReportData, selectedMonthTitle]),
  );

  // --- Computations ---
  const stats = useMemo(() => {
    let total = 0;
    const catTotals: Record<string, number> = {};

    reportData.forEach((d) => {
      total += parseFloat(d.totalExpense) || 0;
      d.all.forEach((item) => {
        const cat = item.category || item.name || "other";
        const val = parseFloat(String(item.value));
        catTotals[cat] = (catTotals[cat] || 0) + val;
      });
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0];

    return {
      total: total.toFixed(2),
      topCategory: topCat ? topCat[0] : "N/A",
      topCatValue: topCat ? topCat[1].toFixed(2) : "0",
      categoryData: sortedCats.map(([k, v], i) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: v,
        color: getColorForCategory(k, i),
      })),
    };
  }, [reportData]);

  // --- Chart Data ---
  const chartData = useMemo(() => {
    const total = parseFloat(stats.total);
    return stats.categoryData.map((d) => ({
      value: d.value,
      color: d.color,
      text: total > 0 ? `${Math.round((d.value / total) * 100)}%` : "",
      label: d.name,
    }));
  }, [stats]);

  // --- HTML Generation (Legacy support) ---
  const generateHTML = useCallback(() => {
    // Basic implementation for menu compatibility
    return `<html><body><h1>Report for ${selectedMonthTitle}</h1></body></html>`;
  }, [selectedMonthTitle]);

  // --- Renderers ---

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.skeletonText}>Analyzing expenses...</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="analytics-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Data Available</Text>
      <Text style={styles.emptySubtitle}>
        {allMonths.length === 0
          ? "Start adding expenses to see analytics."
          : `No records found for ${selectedMonthTitle}.`}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Financial Report</Text>
        <Menu
          generateHTML={generateHTML}
          reportData={reportData} // pass raw data based on interface
          selectedMonthTitle={selectedMonthTitle}
        />
      </View>

      {/* Month Selector */}
      <FlatList
        horizontal
        data={allMonths}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <MonthPill
            label={item}
            isSelected={item === selectedMonthTitle}
            onPress={() => loadReportData(item)}
          />
        )}
      />
    </View>
  );

  const renderCharts = () => (
    <View style={styles.chartSection}>
      <View style={styles.chartWrapper}>
        <GiftedPieChart
          data={chartData}
          donut
          radius={110}
          innerRadius={75}
          showText
          textColor="#fff"
          // openEnded={0}
          innerCircleColor="#fff"
          centerLabelComponent={() => (
            <View style={styles.donutCenter}>
              <Text style={styles.donutTitle}>Total</Text>
              <Text style={styles.donutAmount}>₹{stats.total}</Text>
            </View>
          )}
          animationDuration={1000}
        />
      </View>

      {/* Legend List */}
      <View style={styles.legendContainer}>
        {stats.categoryData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendName}>{item.name}</Text>
            <Text style={styles.legendValue}>₹{item.value.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTable = () => {
    // Prep table data
    const headers = ["Date", "Expense", "Items"];
    return (
      <View style={styles.tableContainer}>
        <Table borderStyle={{ borderWidth: 0 }}>
          <Row
            data={headers}
            style={styles.tableHeader}
            textStyle={styles.tableHeaderText}
            flexArr={[2, 2, 3]}
          />
          {reportData.map((item, i) => (
            <Row
              key={i}
              data={[
                item.todaysDate,
                `₹${parseFloat(item.totalExpense).toFixed(2)}`,
                item.all.length,
              ]}
              style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}
              textStyle={styles.tableRowText}
              flexArr={[2, 2, 3]}
            />
          ))}
        </Table>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Loading State */}
        {isLoading ? (
          renderSkeleton()
        ) : reportData.length === 0 ? (
          renderEmpty()
        ) : (
          <View style={{ gap: 20 }}>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <SummaryCard
                title="Total Spent"
                value={`₹${stats.total}`}
                icon="wallet-outline"
                color="#4F46E5"
              />
              <SummaryCard
                title="Top Category"
                value={stats.topCategory}
                icon="trending-up-outline"
                color="#EC4899"
              />
            </View>

            {/* View Switcher */}
            <ViewSegmentControl selected={viewMode} onSelect={setViewMode} />

            {/* Main Content */}
            <View style={styles.contentCardContainer}>
              <View style={styles.contentCardInner}>
                {viewMode === "chart" ? renderCharts() : renderTable()}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper utility for consistent colors
function getColorForCategory(category: string, index: number): string {
  const map: Record<string, string> = {
    food: "#F59E0B", // Amber
    transport: "#3B82F6", // Blue
    shopping: "#EC4899", // Pink
    entertainment: "#8B5CF6", // Violet
    bills: "#10B981", // Emerald
    health: "#EF4444", // Red
    education: "#06B6D4", // Cyan
    other: "#6B7280", // Gray
  };
  return (
    map[category.toLowerCase()] || `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Golden angle generic colors
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6", // Gray 100
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  monthList: {
    paddingHorizontal: 12,
  },
  monthPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginHorizontal: 4,
  },
  monthPillSelected: {
    backgroundColor: "#4F46E5",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  monthPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  monthPillTextSelected: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCardContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryCardContent: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    flexDirection: "column",
    gap: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  // Segment
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  segmentButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  segmentTextActive: {
    color: "#4F46E5",
  },
  // Main Card
  contentCardContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  contentCardInner: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    minHeight: 300,
  },
  // Chart
  chartSection: {
    alignItems: "center",
    gap: 24,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  donutCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  donutTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  donutAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  legendContainer: {
    width: "100%",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  // Table
  tableContainer: {
    overflow: "hidden",
  },
  tableHeader: {
    height: 40,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#4B5563",
    fontSize: 12,
  },
  tableRow: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableRowAlt: {
    backgroundColor: "#FAFAFA",
  },
  tableRowText: {
    textAlign: "center",
    fontSize: 13,
    color: "#1F2937",
  },
  // Empty & Skeleton
  skeletonContainer: {
    height: 400,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  skeletonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    height: 400,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 250,
  },
});
