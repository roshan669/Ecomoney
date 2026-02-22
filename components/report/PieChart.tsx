import React, { memo, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { RoundedSemiDonut } from "./RoundedSemiDonut";
import { Ionicons } from "@expo/vector-icons";

interface PieChartProps {
  chartData: any[];
  stats: any;
  currencySymbol: string;
  themeColors: any;
  onLegendPress?: (categoryKey: string) => void;
}

export const MemoizedPieChart = memo(
  ({
    chartData,
    stats,
    currencySymbol,
    themeColors,
    onLegendPress,
  }: PieChartProps) => {
    const [focusedKey, setFocusedKey] = useState<string | null>(null);

    function shuffleArray(array: any) {
      for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));

        // Swap the elements at i and j
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    const topCategoryKey = useMemo(() => {
      if (!stats?.categoryData?.length) return null;
      const top = stats.categoryData.reduce(
        (best: any, cur: any) =>
          !best || (cur?.value ?? 0) > (best?.value ?? 0) ? cur : best,
        null,
      );
      return top?.key ?? top?.name ?? null;
    }, [stats?.categoryData]);

    useEffect(() => {
      if (focusedKey == null && topCategoryKey) setFocusedKey(topCategoryKey);
    }, [focusedKey, topCategoryKey]);

    const totalValue = useMemo(() => {
      if (typeof stats?.total === "number") return stats.total;
      const p = parseFloat(stats?.total ?? "0");
      return Number.isFinite(p) ? p : 0;
    }, [stats?.total]);

    const focusedSlice = useMemo(() => {
      if (!Array.isArray(chartData)) return null;
      return (
        chartData.find((item: any) => {
          const key = item?.categoryKey ?? item?.label;
          return key === focusedKey;
        }) ?? null
      );
    }, [chartData, focusedKey]);

    const focusedValue =
      typeof focusedSlice?.value === "number"
        ? focusedSlice.value
        : parseFloat(focusedSlice?.value ?? "0");
    const focusedPercentage =
      totalValue > 0 && Number.isFinite(focusedValue)
        ? Math.round((focusedValue / totalValue) * 100)
        : 0;

    /** Normalise chartData into the shape RoundedSemiDonut expects. */
    const donutData = useMemo(
      () =>
        (chartData ?? [])
          .filter((item: any) => {
            const v = item?.value ?? 0;
            return totalValue > 0 ? v / totalValue >= 0.1 : v > 0;
          })
          .map((item: any) => ({
            key: item?.categoryKey ?? item?.label ?? "",
            value: item?.value ?? 0,
            color: item?.color ?? "#ccc",
          })),
      [chartData, totalValue],
    );

    return (
      <View
        style={[styles.chartSection, { backgroundColor: themeColors.card }]}
      >
        {/* ── Rounded semi-donut ── */}
        <View style={styles.chartWrapper}>
          <RoundedSemiDonut
            cornerRadius={5}
            gapDeg={0}
            separatorWidth={2}
            data={shuffleArray(donutData)}
            focusedKey={focusedKey}
            separatorColor={themeColors.card}
            onSlicePress={(key) => {
              setFocusedKey(key);
            }}
            centerLabelComponent={() => (
              <View style={styles.donutCenter}>
                <Text
                  style={[styles.donutTitle, { color: focusedSlice?.color }]}
                  numberOfLines={1}
                >
                  {focusedPercentage}%
                </Text>
                <Text
                  style={[styles.donutAmount, { color: themeColors.subText }]}
                >
                  {focusedSlice?.label ??
                    focusedSlice?.categoryKey ??
                    "Top category"}{" "}
                  • {currencySymbol}
                  {Number.isFinite(focusedValue)
                    ? focusedValue.toFixed(2)
                    : "0.00"}{" "}
                </Text>
              </View>
            )}
          />
        </View>

        {/* ── Legend ── */}
        <View style={styles.legendContainer}>
          {stats.categoryData.map((item: any, index: number) => {
            const percentage =
              parseFloat(stats.total) > 0
                ? Math.round((item.value / parseFloat(stats.total)) * 100)
                : 0;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.legendItem,
                  {
                    backgroundColor: themeColors.background,
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => {
                  if (item?.key) {
                    onLegendPress?.(item.key);
                  }
                }}
                activeOpacity={1}
              >
                <View
                  style={[
                    styles.legendColor,
                    {
                      backgroundColor: item.color,
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.legendName,
                    {
                      color: themeColors.text,
                      fontSize: 15,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.legendValue,
                    {
                      color: themeColors.subText,
                      fontSize: 14,
                      fontWeight: "500",
                    },
                  ]}
                >
                  {currencySymbol}
                  {item.value.toFixed(2)} · {percentage}%
                </Text>
                <Ionicons name="chevron-forward" color={themeColors.subText} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

MemoizedPieChart.displayName = "MemoizedPieChart";

const styles = StyleSheet.create({
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
    fontSize: 25,
    fontWeight: "bold",
  },
  donutAmount: {
    fontSize: 16,
    fontWeight: "500",
  },
  legendContainer: {
    width: "100%",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legendColor: {
    marginRight: 12,
  },
  legendName: {
    flex: 1,
  },
  legendValue: {},
});
