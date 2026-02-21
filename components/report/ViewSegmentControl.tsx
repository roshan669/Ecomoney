import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ViewSegmentControlProps {
  selected: "chart" | "table";
  onSelect: (v: "chart" | "table") => void;
  themeColors: any;
}

export const ViewSegmentControl = ({ selected, onSelect, themeColors }: ViewSegmentControlProps) => (
  <View style={[styles.container, { backgroundColor: themeColors.border }]}>
    <TouchableOpacity
      style={[
        styles.button,
        selected === "chart" && styles.buttonActive,
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
          styles.text,
          selected === "chart" && styles.textActive,
          { color: selected === "chart" ? "#4F46E5" : themeColors.subText },
        ]}
      >
        Analysis
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.button,
        selected === "table" && styles.buttonActive,
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
          styles.text,
          selected === "table" && styles.textActive,
          { color: selected === "table" ? "#4F46E5" : themeColors.subText },
        ]}
      >
        Records
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  buttonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  textActive: {
    color: "#4F46E5",
  },
});
