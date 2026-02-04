import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
} from "react-native";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  memo,
} from "react";
import { Table, Row } from "react-native-table-component";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { PieChart as GiftedPieChart } from "react-native-gifted-charts";
import type { ReportData } from "@/types/types";
import Menu from "@/components/Menu.modal";
import { HomeContext } from "@/hooks/useHome";
import { useExpenses } from "@/hooks/useExpenses";
import { getCategoryColor } from "@/constants/categories";

// --- Components ---

// Memoized Pie Chart Component
const MemoizedPieChart = memo(
  ({
    chartData,
    stats,
    currencySymbol,
    themeColors,
    onSlicePress,
  }: {
    chartData: any[];
    stats: any;
    currencySymbol: string;
    themeColors: any;
    onSlicePress?: (categoryKey: string) => void;
  }) => (
    <View style={[styles.chartSection, { backgroundColor: themeColors.card }]}>
      <View style={styles.chartWrapper}>
        <GiftedPieChart
          data={chartData}
          donut
          radius={150}
          innerRadius={80}
          showText
          textColor="#fff"
          innerCircleColor={themeColors.card}
          focusOnPress
          onPress={(item: any) => {
            if (onSlicePress && item) {
              const key = (item as any).categoryKey || (item as any).label;
              if (typeof key === "string" && key.length > 0) {
                onSlicePress(key);
              }
            }
          }}
          centerLabelComponent={() => (
            <View style={styles.donutCenter}>
              <Text style={[styles.donutTitle, { color: themeColors.subText }]}>
                Total
              </Text>
              <Text style={[styles.donutAmount, { color: themeColors.text }]}>
                {currencySymbol}
                {stats.total}
              </Text>
            </View>
          )}
          animationDuration={1000}
        />
      </View>

      {/* Legend List */}
      <View style={styles.legendContainer}>
        {stats.categoryData.map((item: any, index: number) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={[styles.legendName, { color: themeColors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.legendValue, { color: themeColors.text }]}>
              {currencySymbol}
              {item.value.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  ),
);

MemoizedPieChart.displayName = "MemoizedPieChart";

// 1. Summary Card
const SummaryCard = ({
  title,
  value,
  icon,
  color,
  themeColors,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  themeColors: any;
}) => (
  <View
    style={[styles.summaryCardContainer, { backgroundColor: themeColors.card }]}
  >
    <View
      style={[styles.summaryCardContent, { backgroundColor: themeColors.card }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={[styles.summaryLabel, { color: themeColors.subText }]}>
          {title}
        </Text>
        <Text style={[styles.summaryValue, { color: themeColors.text }]}>
          {value}
        </Text>
      </View>
    </View>
  </View>
);

// 2. Segmented Control
const ViewSegmentControl = ({
  selected,
  onSelect,
  themeColors,
}: {
  selected: "chart" | "table";
  onSelect: (v: "chart" | "table") => void;
  themeColors: any;
}) => (
  <View
    style={[styles.segmentContainer, { backgroundColor: themeColors.border }]}
  >
    <TouchableOpacity
      style={[
        styles.segmentButton,
        selected === "chart" && styles.segmentButtonActive,
        selected === "chart" && { backgroundColor: themeColors.card },
      ]}
      onPress={() => onSelect("chart")}
    >
      <Ionicons
        name="pie-chart"
        size={18}
        color={selected === "chart" ? "#4F46E5" : themeColors.icon}
      />
      <Text
        style={[
          styles.segmentText,
          selected === "chart" && styles.segmentTextActive,
          { color: selected === "chart" ? "#4F46E5" : themeColors.subText },
        ]}
      >
        Analysis
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.segmentButton,
        selected === "table" && styles.segmentButtonActive,
        selected === "table" && { backgroundColor: themeColors.card },
      ]}
      onPress={() => onSelect("table")}
    >
      <Ionicons
        name="list"
        size={18}
        color={selected === "table" ? "#4F46E5" : themeColors.icon}
      />
      <Text
        style={[
          styles.segmentText,
          selected === "table" && styles.segmentTextActive,
          { color: selected === "table" ? "#4F46E5" : themeColors.subText },
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
    useState<string>("All Time");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const { currencySymbol, themeColors, theme, dbVersion } =
    useContext(HomeContext);

  const router = useRouter();

  // Database hook for expense analytics
  const { loadExpenses } = useExpenses();

  // Refs
  const isMounted = useRef(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasLoadedRef = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const loadingRef = useRef(false);
  const previousReportDataRef = useRef<string>("");
  const dbVersionRef = useRef<number>(0);

  // Update hasLoadedRef when we have data
  useEffect(() => {
    if (reportData.length > 0) {
      hasLoadedRef.current = true;
    }
  }, [reportData]);

  const loadReportData = useCallback(
    async (month: string, expenses?: any[]) => {
      if (!isMounted.current) return;

      // Only show loading if we haven't loaded data before
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }

      try {
        // Use provided expenses or fall back to state
        const expensesToUse = expenses || allExpenses;

        // Parse month string (e.g., "Jan 2026") to get start and end dates
        const [monthStr, yearStr] = month.split(" ");
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
        const year = parseInt(yearStr);

        if (monthIndex === -1 || isNaN(year)) {
          console.error("Invalid month format:", month);
          return;
        }

        // Create dates using year and month index (0-based)
        const startDate = new Date(year, monthIndex, 1)
          .toISOString()
          .split("T")[0];
        const endDate = new Date(year, monthIndex + 1, 0)
          .toISOString()
          .split("T")[0];

        console.log(
          "Loading report data for month:",
          month,
          "Range:",
          startDate,
          "-",
          endDate,
        );
        console.log("Total expenses to filter:", expensesToUse.length);

        // Group expenses by day
        const groupedByDay: Record<string, any[]> = {};
        expensesToUse.forEach((exp) => {
          if (exp.date >= startDate && exp.date <= endDate) {
            if (!groupedByDay[exp.date]) {
              groupedByDay[exp.date] = [];
            }
            groupedByDay[exp.date].push({
              id: exp.id,
              name: exp.name,
              value: exp.value,
              category: exp.category,
            });
          }
        });

        console.log(
          "Grouped expenses by day:",
          Object.keys(groupedByDay).length,
          "days",
        );

        // Convert to ReportData format
        const reportDataArray: ReportData[] = Object.entries(groupedByDay)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, items]) => ({
            todaysDate: date,
            totalExpense: items
              .reduce((sum, item) => sum + item.value, 0)
              .toFixed(2),
            month: month,
            all: items,
            time: new Date().toISOString(),
          }));

        console.log("Report data array:", reportDataArray);

        const updateData = () => {
          if (isMounted.current) {
            setReportData(reportDataArray);
            setSelectedMonthTitle(month);
          }
        };

        // Check if data actually changed by comparing with previous data
        const newDataString = JSON.stringify(reportDataArray);
        const dataChanged = newDataString !== previousReportDataRef.current;
        previousReportDataRef.current = newDataString;

        if (hasLoadedRef.current && isMounted.current && dataChanged) {
          // Smooth transition: Fade Out -> Update -> Fade In (only if data changed)
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) {
              updateData();
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
              }).start(() => {
                if (isMounted.current) setIsLoading(false);
              });
            }
          });
        } else {
          // First load or no data change
          updateData();
          if (!dataChanged && hasLoadedRef.current) {
            // Data hasn't changed, just set opacity to 1 without animation
            fadeAnim.setValue(1);
          } else {
            // First load
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: false,
            }).start();
          }
          if (isMounted.current) setIsLoading(false);
        }
      } catch (_e) {
        console.error(_e);
        if (isMounted.current) {
          setReportData([]);
          setSelectedMonthTitle(month);
          setIsLoading(false);
        }
      }
    },
    [fadeAnim, allExpenses],
  );

  // Load all data combined (All Time view)
  const loadAllData = useCallback(
    async (expenses?: any[]) => {
      if (!isMounted.current) return;

      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }

      try {
        const expensesToUse = expenses || allExpenses;
        console.log("Loading ALL data, total expenses:", expensesToUse.length);

        // Group all expenses by day
        const groupedByDay: Record<string, any[]> = {};
        expensesToUse.forEach((exp) => {
          if (!groupedByDay[exp.date]) {
            groupedByDay[exp.date] = [];
          }
          groupedByDay[exp.date].push({
            id: exp.id,
            name: exp.name,
            value: exp.value,
            category: exp.category,
          });
        });

        // Convert to ReportData format
        const reportDataArray: ReportData[] = Object.entries(groupedByDay)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, items]) => ({
            todaysDate: date,
            totalExpense: items
              .reduce((sum, item) => sum + item.value, 0)
              .toFixed(2),
            month: "All Time",
            all: items,
            time: new Date().toISOString(),
          }));

        const updateData = () => {
          if (isMounted.current) {
            setReportData(reportDataArray);
            setSelectedMonthTitle("All Time");
          }
        };

        const newDataString = JSON.stringify(reportDataArray);
        const dataChanged = newDataString !== previousReportDataRef.current;
        previousReportDataRef.current = newDataString;

        if (hasLoadedRef.current && isMounted.current && dataChanged) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) {
              updateData();
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
              }).start(() => {
                if (isMounted.current) setIsLoading(false);
              });
            }
          });
        } else {
          updateData();
          if (!dataChanged && hasLoadedRef.current) {
            fadeAnim.setValue(1);
          } else {
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: false,
            }).start();
          }
          if (isMounted.current) setIsLoading(false);
        }
      } catch (_e) {
        console.error(_e);
        if (isMounted.current) {
          setReportData([]);
          setSelectedMonthTitle("All Time");
          setIsLoading(false);
        }
      }
    },
    [fadeAnim, allExpenses],
  );

  // --- Effects ---
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Check if we need to reload data based on database changes
      const shouldReload =
        !hasLoadedRef.current || dbVersionRef.current !== dbVersion;

      // Only reload if:
      // 1. We haven't loaded data before, OR
      // 2. Database version has changed (indicating DB modifications)
      if (shouldReload) {
        // Prevent multiple simultaneous loads
        if (loadingRef.current) return;
        loadingRef.current = true;
        dbVersionRef.current = dbVersion;

        const init = async () => {
          // Only show loading if we haven't loaded data before
          if (!hasLoadedRef.current) {
            setIsLoading(true);
          }

          try {
            // Load all expenses from database
            const allExp = await loadExpenses();
            console.log("Loaded expenses from DB:", allExp);
            if (isMounted.current) {
              setAllExpenses(allExp);

              // Get available months from all expenses
              const monthSet = new Set<string>();
              allExp.forEach((exp: any) => {
                if (exp.date) {
                  // Parse date string directly (format: YYYY-MM-DD)
                  const [year, month, day] = exp.date.split("-").map(Number);
                  const date = new Date(year, month - 1, day); // month is 0-indexed
                  const monthKey = date.toLocaleString("en-US", {
                    month: "short",
                    year: "numeric",
                  });
                  monthSet.add(monthKey);
                }
              });

              const months = Array.from(monthSet).sort(
                (a, b) => new Date(a).getTime() - new Date(b).getTime(),
              );

              console.log("Available months:", months);
              setAllMonths(months);

              if (allExp.length > 0) {
                // Load based on current selection
                if (selectedMonthTitle === "All Time") {
                  console.log("Loading all data");
                  await loadAllData(allExp);
                } else if (months.includes(selectedMonthTitle)) {
                  console.log("Loading report for month:", selectedMonthTitle);
                  await loadReportData(selectedMonthTitle, allExp);
                } else {
                  // Default to All Time view
                  console.log("Loading all data (default)");
                  await loadAllData(allExp);
                }
                lastFetchTime.current = Date.now();
              } else {
                console.log("No expenses found");
                setIsLoading(false);
                setReportData([]);
                setSelectedMonthTitle("All Time");
                lastFetchTime.current = Date.now();
              }
            }
          } catch (error) {
            console.error("Error loading report data:", error);
            if (isMounted.current) setIsLoading(false);
          } finally {
            loadingRef.current = false;
          }
        };

        init();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dbVersion]),
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
        key: k,
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: v,
        color: getCategoryColor(k),
      })),
    };
  }, [reportData]);

  // --- Chart Data ---
  const chartData = useMemo(() => {
    const total = parseFloat(stats.total);
    return stats.categoryData.map((d: any) => {
      const key = d.key || d.name?.toLowerCase?.() || "other";
      const percentage = total > 0 ? Math.round((d.value / total) * 100) : 0;
      return {
        value: d.value,
        color: d.color,
        text: percentage < 2 ? percentage : percentage + "%",
        textSize: percentage < 3 ? 8 : percentage < 10 ? 10 : 17,
        label: d.name,
        categoryKey: key,
      };
    });
  }, [stats]);

  const handleSlicePress = useCallback(
    (categoryKey: string) => {
      if (!categoryKey) return;
      router.push({
        pathname: "/category-expenses",
        params: {
          category: categoryKey.toLowerCase(),
          period: selectedMonthTitle,
        },
      });
    },
    [router, selectedMonthTitle],
  );

  // --- HTML Generation ---
  const generateHTML = useCallback(() => {
    let rows = "";
    let grandTotal = 0;

    // Create rows for each item
    reportData.forEach((dayData) => {
      dayData.all.forEach((item) => {
        const val =
          typeof item.value === "number"
            ? item.value
            : parseFloat(String(item.value));
        grandTotal += val || 0;
        rows += `
              <tr>
                  <td>${dayData.todaysDate}</td>
                  <td>${item.name}</td>
                  <td>${currencySymbol}${(val || 0).toFixed(2)}</td>
              </tr>
           `;
      });
    });

    // Generate chart conic-gradient segments
    let conicGradient = "";
    let currentAngle = 0;
    const totalForChart = parseFloat(stats.total) || 1; // avoid divide by zero

    chartData.forEach((d, i) => {
      const percentage = (d.value / totalForChart) * 100;
      const start = currentAngle;
      const end = currentAngle + percentage;
      conicGradient += `${d.color} ${start}% ${end}%, `;
      currentAngle = end;
    });
    // Remove last comma and space
    conicGradient = conicGradient.slice(0, -2);
    if (!conicGradient) conicGradient = "#E5E7EB 0% 100%";

    // Legends HTML
    const legendsHtml = chartData
      .map(
        (d) => `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${d.color}"></div>
        <div class="legend-name">${d.label}</div>
        <div class="legend-val">${currencySymbol}${d.value.toFixed(2)} (${
          totalForChart > 0 ? Math.round((d.value / totalForChart) * 100) : 0
        }%)</div>
      </div>
    `,
      )
      .join("");

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #111827; margin-bottom: 24px; }
            .total { text-align: right; font-size: 20px; margin-top: 24px; font-weight: bold; color: #111827; }
            table { width: 100%; border-collapse: collapse; background-color: white; font-size: 14px; margin-bottom: 40px; }
            thead { background-color: #4F46E5; }
            th { color: white; padding: 12px; text-align: left; font-weight: 600; border: 1px solid #4F46E5; }
            td { border: 1px solid #E5E7EB; padding: 10px; color: #374151; }
            tr:nth-child(even) { background-color: #F9FAFB; }
            .date-col { width: 25%; }
            .item-col { width: 50%; }
            .price-col { width: 25%; }
            
            /* Chart Section */
            .chart-section { 
              page-break-inside: avoid;
              margin-top: 40px; 
              display: flex;
              flex-direction: column;
              align-items: center;
              border-top: 2px solid #E5E7EB;
              padding-top: 40px;
            }
            .pie-chart {
              width: 200px;
              height: 200px;
              border-radius: 50%;
              background: conic-gradient(${conicGradient});
              position: relative;
              margin-bottom: 30px;
            }
            .pie-hole {
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              width: 120px; height: 120px;
              background: white;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .hole-label { font-size: 12px; color: #6B7280; }
            .hole-total { font-size: 16px; font-weight: bold; color: #1F2937; }

            .legends {
              width: 100%;
              max-width: 400px;
            }
            .legend-item {
              display: flex;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #F3F4F6;
            }
            .legend-color {
              width: 12px; height: 12px;
              border-radius: 6px;
              margin-right: 12px;
            }
            .legend-name {
              flex: 1;
              font-size: 14px;
              color: #374151;
            }
            .legend-val {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
            }
          </style>
        </head>
        <body>
          <h1>Financial Report - ${selectedMonthTitle}</h1>
          
          <table>
            <thead>
              <tr>
                <th class="date-col">Date</th>
                <th class="item-col">Item Name</th>
                <th class="price-col">Price</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="3" style="text-align:center">No records found</td></tr>'}
            </tbody>
          </table>
          <div class="total">Total Expenses: ${currencySymbol}${grandTotal.toFixed(2)}</div>

          <div class="chart-section">
            <h2>Expense Breakdown</h2>
            <div class="pie-chart">
              <div class="pie-hole">
                <div class="hole-label">Total</div>
                <div class="hole-total">${currencySymbol}${grandTotal.toFixed(2)}</div>
              </div>
            </div>
            <div class="legends">
              ${legendsHtml}
            </div>
          </div>
        </body>
      </html>
      `;
  }, [reportData, selectedMonthTitle, stats, chartData, currencySymbol]);

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
    <View style={[styles.header, { backgroundColor: themeColors.background }]}>
      <View
        style={[styles.headerTop, { borderBottomColor: themeColors.border }]}
      >
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {selectedMonthTitle === "All Time"
            ? "All Time Report"
            : "Monthly Report"}
        </Text>
        <Menu
          generateHTML={generateHTML}
          reportData={reportData} // pass raw data based on interface
          selectedMonthTitle={selectedMonthTitle}
        />
      </View>

      {/* Month Dropdown Selector */}
      <TouchableOpacity
        style={[
          styles.monthDropdown,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
        onPress={() => setShowMonthPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={18} color="#4F46E5" />
        <Text style={[styles.monthDropdownText, { color: themeColors.text }]}>
          {selectedMonthTitle}
        </Text>
        <Ionicons name="chevron-down" size={18} color={themeColors.subText} />
      </TouchableOpacity>
    </View>
  );

  const renderCharts = useCallback(
    () => (
      <MemoizedPieChart
        chartData={chartData}
        stats={stats}
        currencySymbol={currencySymbol}
        themeColors={themeColors}
        onSlicePress={handleSlicePress}
      />
    ),
    [chartData, stats, currencySymbol, themeColors, handleSlicePress],
  );

  const renderTable = () => {
    // Prep table data
    const headers = ["Date", "Expense", "Items"];
    return (
      <View
        style={[styles.tableContainer, { backgroundColor: themeColors.card }]}
      >
        <Table borderStyle={{ borderWidth: 0 }}>
          <Row
            data={headers}
            style={[
              styles.tableHeader,
              { backgroundColor: themeColors.border },
            ]}
            textStyle={[styles.tableHeaderText, { color: themeColors.text }]}
            flexArr={[2, 2, 3]}
          />
          {reportData.map((item, i) => (
            <Row
              key={i}
              data={[
                item.todaysDate,
                `${currencySymbol}${parseFloat(item.totalExpense).toFixed(2)}`,
                item.all.length,
              ]}
              style={[
                styles.tableRow,
                {
                  backgroundColor:
                    i % 2 === 1
                      ? theme === "dark"
                        ? "#27272A"
                        : "#F9FAFB"
                      : themeColors.card,
                },
              ]}
              textStyle={[styles.tableRowText, { color: themeColors.subText }]}
              flexArr={[2, 2, 3]}
            />
          ))}
        </Table>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
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
                value={`${currencySymbol}${stats.total}`}
                icon="wallet-outline"
                color="#4F46E5"
                themeColors={themeColors}
              />
              <SummaryCard
                title="Top Category"
                value={stats.topCategory.toLocaleUpperCase()}
                icon="trending-up-outline"
                color="#EC4899"
                themeColors={themeColors}
              />
            </View>

            {/* View Switcher */}
            <ViewSegmentControl
              selected={viewMode}
              onSelect={setViewMode}
              themeColors={themeColors}
            />

            {/* Main Content */}
            <Animated.View
              style={[
                styles.contentCardContainer,
                { opacity: fadeAnim, backgroundColor: themeColors.card },
              ]}
            >
              <View
                style={[
                  styles.contentCardInner,
                  { backgroundColor: themeColors.card },
                ]}
              >
                {viewMode === "chart" ? renderCharts() : renderTable()}
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMonthPicker(false)}
        >
          <Pressable
            style={[
              styles.monthPickerContainer,
              { backgroundColor: themeColors.card },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.monthPickerHeader}>
              <Text
                style={[styles.monthPickerTitle, { color: themeColors.text }]}
              >
                Select Period
              </Text>
              <TouchableOpacity
                onPress={() => setShowMonthPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={themeColors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.monthPickerList}
              showsVerticalScrollIndicator={false}
            >
              {/* All Time Option */}
              <TouchableOpacity
                style={[
                  styles.monthPickerItem,
                  selectedMonthTitle === "All Time" && {
                    backgroundColor: themeColors.background,
                  },
                  { borderBottomColor: themeColors.border },
                ]}
                onPress={() => {
                  loadAllData();
                  setShowMonthPicker(false);
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={
                    selectedMonthTitle === "All Time"
                      ? "#4F46E5"
                      : themeColors.subText
                  }
                />
                <Text
                  style={[
                    styles.monthPickerItemText,
                    {
                      color:
                        selectedMonthTitle === "All Time"
                          ? "#4F46E5"
                          : themeColors.text,
                    },
                    selectedMonthTitle === "All Time" &&
                      styles.monthPickerItemTextSelected,
                  ]}
                >
                  All Time
                </Text>
                {selectedMonthTitle === "All Time" && (
                  <Ionicons name="checkmark" size={20} color="#4F46E5" />
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View
                style={[
                  styles.monthPickerDivider,
                  { backgroundColor: themeColors.border },
                ]}
              >
                <Text
                  style={[
                    styles.monthPickerDividerText,
                    { color: themeColors.subText },
                  ]}
                >
                  By Month
                </Text>
              </View>

              {/* Month Options - Reversed to show latest first */}
              {[...allMonths].reverse().map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthPickerItem,
                    selectedMonthTitle === month && {
                      backgroundColor: themeColors.background,
                    },
                    { borderBottomColor: themeColors.border },
                  ]}
                  onPress={() => {
                    loadReportData(month);
                    setShowMonthPicker(false);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={
                      selectedMonthTitle === month
                        ? "#4F46E5"
                        : themeColors.subText
                    }
                  />
                  <Text
                    style={[
                      styles.monthPickerItemText,
                      {
                        color:
                          selectedMonthTitle === month
                            ? "#4F46E5"
                            : themeColors.text,
                      },
                      selectedMonthTitle === month &&
                        styles.monthPickerItemTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                  {selectedMonthTitle === month && (
                    <Ionicons name="checkmark" size={20} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Helper utility for consistent colors

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
  // Month Dropdown
  monthDropdown: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  monthDropdownText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  monthPickerContainer: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  monthPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  monthPickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  monthPickerList: {
    maxHeight: 400,
  },
  monthPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  monthPickerItemSelected: {
    backgroundColor: "#EEF2FF",
  },
  monthPickerItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },
  monthPickerItemTextSelected: {
    fontWeight: "600",
  },
  monthPickerDivider: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
  },
  monthPickerDividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    fontSize: 18,
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
