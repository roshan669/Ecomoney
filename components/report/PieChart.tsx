import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { PieChart as GiftedPieChart } from "react-native-gifted-charts";

interface PieChartProps {
  chartData: any[];
  stats: any;
  currencySymbol: string;
  themeColors: any;
  onSlicePress?: (categoryKey: string) => void;
}

export const MemoizedPieChart = memo(
  ({ chartData, stats, currencySymbol, themeColors, onSlicePress }: PieChartProps) => (
    <View style={[styles.chartSection, { backgroundColor: themeColors.card }]}>
      <View style={styles.chartWrapper}>
        <GiftedPieChart
          data={chartData}
          donut
          semiCircle
          radius={150}
          innerRadius={85}
          innerCircleColor={themeColors.card}
          focusOnPress
          strokeWidth={3}
          strokeColor={themeColors.card}
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
                Total Spent
              </Text>
              <Text style={[styles.donutAmount, { color: themeColors.text }]}>
                {currencySymbol}{stats.total}
              </Text>
            </View>
          )}
          animationDuration={1200}
        />
      </View>

      <View style={styles.legendContainer}>
        {stats.categoryData.map((item: any, index: number) => {
          const percentage = parseFloat(stats.total) > 0
            ? Math.round((item.value / parseFloat(stats.total)) * 100)
            : 0;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.legendItem, {
                backgroundColor: themeColors.background,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 8,
              }]}
              onPress={() => onSlicePress?.(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.legendColor, {
                backgroundColor: item.color,
                width: 16,
                height: 16,
                borderRadius: 4,
              }]} />
              <Text style={[styles.legendName, {
                color: themeColors.text,
                fontSize: 15,
                fontWeight: "600",
              }]}>
                {item.name}
              </Text>
              <Text style={[styles.legendValue, {
                color: themeColors.subText,
                fontSize: 14,
                fontWeight: "500",
              }]}>
                {currencySymbol}{item.value.toFixed(2)} · {percentage}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  )
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
    fontSize: 12,
    fontWeight: "500",
  },
  donutAmount: {
    fontSize: 18,
    fontWeight: "700",
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
