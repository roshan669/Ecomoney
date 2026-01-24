import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";

const { width, height } = Dimensions.get("window");

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
    walletScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // 2. Coin drops after a slight delay
    // Coin opacity fades out when it goes "in"
    coinOpacity.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 100 }), // Fade in
        withDelay(600, withTiming(0, { duration: 200 })), // Fade out
      ),
    );

    coinTranslateY.value = withDelay(
      500,
      withSequence(
        withTiming(0, { duration: 600, easing: Easing.bounce }), // Drop in
        withDelay(500, withTiming(40, { duration: 300 })), // Slide down/disappear into wallet
      ),
    );

    // 3. Finish animation - fade out container
    containerOpacity.value = withDelay(
      2000,
      withTiming(0, { duration: 500 }, (finished) => {
        runOnJS(onFinish)();
      }),
    );
  }, []);

  const walletStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: walletScale.value }],
    };
  });

  const coinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: coinTranslateY.value }],
      opacity: coinOpacity.value,
      zIndex: -1, // Behind the front of the wallet?
      // Actually we overlay it, but visual trickery is easier.
      // Let's just drop it "on top" or "into".
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
    top: -50, // Start above
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
    zIndex: 1,
  },
});
