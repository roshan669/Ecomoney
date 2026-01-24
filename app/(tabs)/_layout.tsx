import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from "react";
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
        // animation: "fade", // Removed to prevent shadow artifacts on Android
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
        name="report"
        options={{
          // animation: "shift", // Removed to prevent shadow artifacts
          headerTitleAlign: "center",
          title: "Report",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar-sharp" : "calendar-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
