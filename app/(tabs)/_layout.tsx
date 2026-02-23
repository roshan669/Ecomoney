import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { HomeContext } from "@/hooks/useHome";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { themeColors } = useContext(HomeContext);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.icon,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          paddingBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopColor: themeColors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          alignItems: "center",
        },
        headerStyle: {
          backgroundColor: themeColors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconHitArea}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                color={color}
                size={24}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "",
          headerShown: false,
          tabBarButton: (props) => (
            <View style={styles.addButtonWrap}>
              <Pressable
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                style={({ pressed }) => [
                  styles.addButtonOuter,
                  props.accessibilityState?.selected &&
                    styles.addButtonOuterActive,
                  pressed && styles.addButtonOuterPressed,
                ]}
              >
                <View
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: themeColors.tint,
                      shadowColor: themeColors.tint,
                    },
                    props.accessibilityState?.selected &&
                      styles.addButtonActive,
                  ]}
                >
                  <Ionicons name="add" size={26} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
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
            <View style={styles.iconHitArea}>
              <Ionicons
                name={focused ? "analytics-sharp" : "analytics-outline"}
                color={color}
                size={24}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  iconHitArea: {
    width: 70,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  addButtonOuter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
  },
  addButtonOuterActive: {
    backgroundColor: "rgba(79, 70, 229, 0.15)",
  },
  addButtonOuterPressed: {
    transform: [{ scale: 0.98 }],
  },
  addButtonActive: {
    transform: [{ scale: 1.02 }],
  },
});
