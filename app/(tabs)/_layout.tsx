import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const datestr = new Date().toDateString().slice(4, 15);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
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
