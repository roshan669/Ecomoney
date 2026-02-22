import { HomeContext, HomeProvider } from "@/hooks/useHome";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect, useState } from "react";
import { View } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import AnimatedSplashScreen from "@/components/AnimatedSplashScreen";
import * as SplashScreen from "expo-splash-screen";
import { initializeDatabase } from "@/database/init";
import notifee, { EventType } from "@notifee/react-native";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

function Layout() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const { theme, themeColors, setDbInitialized } = useContext(HomeContext);
  const router = useRouter();

  // Initialize database on app startup
  useEffect(() => {
    try {
      initializeDatabase();
      setDbInitialized(true);
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }

    notifee.getInitialNotification().then((initialNotification) => {
      if (
        initialNotification?.notification?.data?.action === "open_expense_sheet"
      ) {
        setTimeout(() => {
          console.log("Navigating to add screen from initial notification");
          router.push("/(tabs)/add");
        }, 1000);
      }
    });

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      console.log("Foreground event:", type, detail.notification?.data);
      if (
        type === EventType.PRESS &&
        detail.notification?.data?.action === "open_expense_sheet"
      ) {
        console.log("Navigating to add screen from foreground event");
        router.push("/(tabs)/add");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, setDbInitialized]);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar
        style={theme === "dark" ? "light" : "dark"}
        backgroundColor={themeColors.background}
        translucent={false}
      />
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: themeColors.background }}
      >
        <NavHandler />
      </SafeAreaView>
      {!isSplashFinished && (
        <AnimatedSplashScreen onFinish={() => setIsSplashFinished(true)} />
      )}
    </View>
  );
}

const NavHandler = () => {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem("hasLaunched").then((value) => {
      if (value === null) {
        router.replace("/onboarding");
      }
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="category-expenses" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <HomeProvider>
          <Layout />
        </HomeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
