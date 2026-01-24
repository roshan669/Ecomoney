import React, { useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { currencies } from "@/constants/categories";
import { HomeContext } from "@/hooks/useHome";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Track Your Finances",
    description:
      "Easily record your daily expenses to keep track of your money flow.",
    icon: "wallet-outline",
  },
  {
    id: "2",
    title: "Detailed Reports",
    description:
      "View comprehensive reports and visualize your spending habits over time.",
    icon: "bar-chart-outline",
  },
  {
    id: "3",
    title: "Stay Organized",
    description:
      "Categorize your transactions and manage your budget effectively.",
    icon: "checkmark-done-circle-outline",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("$");
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { themeColors, theme, setCurrencySymbol } = useContext(HomeContext); // Access theme context

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem("hasLaunched", "true");
      setCurrencySymbol(selectedCurrency);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const renderItem = ({ item }: { item: (typeof slides)[0] }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.icon as any}
            size={100}
            color={themeColors.tint}
          />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: themeColors.subText }]}>
          {item.description}
        </Text>

        {/* Currency Selection on the last slide */}
        {item.id === "3" && (
          <View style={styles.currencyContainer}>
            <Text
              style={[styles.currencyLabel, { color: themeColors.subText }]}
            >
              Select Currency:
            </Text>
            <View style={styles.currencyOptions}>
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyButton,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      shadowColor: themeColors.text, // Subtle shadow based on theme
                    },
                    selectedCurrency === curr && {
                      backgroundColor: themeColors.tint,
                      borderColor: themeColors.tint,
                    },
                  ]}
                  onPress={() => setSelectedCurrency(curr)}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      { color: themeColors.text },
                      selectedCurrency === curr && styles.currencyTextSelected,
                    ]}
                  >
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: themeColors.border },
                currentIndex === index && {
                  backgroundColor: themeColors.tint,
                  width: 20,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.tint }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height: height * 0.7,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  footer: {
    height: height * 0.25,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  currencyContainer: {
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  currencyOptions: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15,
  },
  currencyButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, // Keep shadowopacity but color is handled inline
    shadowRadius: 1.41,
  },
  currencyText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  currencyTextSelected: {
    color: "#fff",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
