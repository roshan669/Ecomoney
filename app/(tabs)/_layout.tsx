import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from "react";
import { View, StyleSheet } from "react-native";
import { HomeContext } from "@/hooks/useHome";

export default function TabLayout() {
  const { themeColors } = useContext(HomeContext);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.icon,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopColor: themeColors.border,
        },
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              // name="add"
              color={color}
              size={26}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          headerTitleAlign: "center",
          title: "Analytics",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "analytics-sharp" : "analytics-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
