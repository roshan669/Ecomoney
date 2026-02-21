import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  themeColors: any;
}

export const SummaryCard = ({ title, value, icon, color, themeColors }: SummaryCardProps) => (
  <View style={[styles.container, { backgroundColor: themeColors.card }]}>
    <View style={[styles.content, { backgroundColor: themeColors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={[styles.label, { color: themeColors.subText }]}>{title}</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>{value}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    flexDirection: "column",
    gap: 12,
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
  label: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
});
