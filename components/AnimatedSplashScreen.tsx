import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export default function AnimatedSplashScreen({
  onFinish,
}: AnimatedSplashScreenProps) {
  // Animation values
  const walletScale = useSharedValue(0);
  const coinTranslateY = useSharedValue(-100);
  const coinOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Hide native splash screen once we are mounted
    SplashScreen.hideAsync();
    // 1. Wallet pops up
    walletScale.value = withTiming(1.5, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // 2. Coin drops after a slight delay
    coinOpacity.value = withDelay(
      600,
      withSequence(
        withTiming(1, { duration: 400 }), // Fade in quickly
        withDelay(800, withTiming(0, { duration: 300 })), // Fade out after showing
      ),
    );

    // Coin falls from top onto wallet (travels ~220px to land on wallet)
    coinTranslateY.value = withDelay(
      600,
      withSequence(
        withTiming(450, { duration: 1000, easing: Easing.ease }), // Drop down with bounce to land on wallet
        // withDelay(500, withTiming(250, { duration: 400 })), // Continue falling/disappearing
      ),
    );

    // 3. Finish animation - fade out container
    containerOpacity.value = withDelay(
      2500,
      withTiming(0, { duration: 500 }, (finished) => {
        runOnJS(onFinish)();
      }),
    );
  }, [onFinish]);

  const walletStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: walletScale.value }],
    };
  });

  const coinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: coinTranslateY.value }],
      opacity: coinOpacity.value,
      zIndex: 0, // On top of wallet for visibility
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.center}>
        {/* Coin */}
        <Animated.View style={[styles.coin, coinStyle]}>
          <Ionicons name="logo-usd" size={30} color="#FFD700" />
        </Animated.View>

        {/* Wallet */}
        <Animated.View style={[styles.wallet, walletStyle]}>
          <Ionicons name="wallet" size={80} color="#fff" />
        </Animated.View>
      </View>

      <Text style={styles.appName}>EcoMoney</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#4F46E5", // App primary color
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  wallet: {
    zIndex: 2,
    // Add a shadow to make it pop
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  coin: {
    position: "absolute",
    top: -80, // Start further above so it drops onto wallet
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
    zIndex: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    position: "absolute",
    bottom: 100,
  },
});
