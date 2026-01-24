import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { list, ReportData } from "@/types/types";
import { HomeContext } from "@/hooks/useHome";
import BottomSheet from "@/components/BottomSheet";
import Alert from "@/components/Alert.modal";
import { getCategoryColor, getCategoryIcon } from "@/constants/categories";

// --- Component: Expense Item Row ---

const ExpenseRow = ({
  item,
  onDelete,
  currencySymbol,
  themeColors,
}: {
  item: list;
  onDelete: () => void;
  currencySymbol: string;
  themeColors: any;
}) => {
  const color = getCategoryColor(item.category);
  const icon = getCategoryIcon(item.category);

  return (
    <View style={styles.expenseRow}>
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      {/* Name */}
      <View style={styles.expenseInfo}>
        <Text
          style={[styles.expenseName, { color: themeColors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.expenseCategory, { color: themeColors.subText }]}>
          {item.category || "General"}
        </Text>
      </View>

      {/* Value Display (Read Only) */}
      <View
        style={[
          styles.amountBadge,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
      >
        <Text style={[styles.currencyPrefix, { color: themeColors.subText }]}>
          {currencySymbol}
        </Text>
        <Text style={[styles.amountText, { color: themeColors.text }]}>
          {item.value?.toLocaleString() || "0"}
        </Text>
      </View>

      {/* Delete Action */}
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

export default function Index() {
  const currentDate = new Date();

  const {
    expList,
    setExpList,
    setAllInputs,
    bottomSheetModalRef,
    inputRefs,
    setShowWarning,
    setAgree,
    setItemToDelete,
    agree,
    showWarning,
    currencySymbol,
    themeColors,
    theme,
  } = useContext(HomeContext)!;

  const [todaysExpenses, setTodaysExpenses] = useState<list[]>([]);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<list | null>(null);

  // Animation for list entry
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // --- Daily Reset Logic ---
  useEffect(() => {
    const checkDailyReset = async () => {
      try {
        const today = currentDate.toDateString();
        const lastResetDate = await AsyncStorage.getItem("LAST_RESET_DATE");

        if (lastResetDate !== today) {
          // New Day Detected: Clear current session expenses
          await AsyncStorage.setItem("perfer", "[]");
          setAllInputs([]);
          setExpList([]);

          await AsyncStorage.setItem("LAST_RESET_DATE", today);
        }
      } catch (error) {
        console.error("Error checking daily reset:", error);
      }
    };
    checkDailyReset();
  }, [setAllInputs, setExpList]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expList.length]);

  const handlePresentModalPress = useCallback(() => {
    inputRefs.current.forEach((input) => input?.blur());
    (bottomSheetModalRef as any).current?.present();
  }, [bottomSheetModalRef, inputRefs]);

  const todaysDate = currentDate.toDateString().slice(4);

  // --- Logic: Save Expenses ---
  const saveTodayExpenses = useCallback(
    async (list: list[]) => {
      const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);

      try {
        const storedData = await AsyncStorage.getItem(month);
        const existingData: ReportData[] = storedData
          ? JSON.parse(storedData)
          : [];
        const idx = existingData.findIndex((i) => i.todaysDate === todaysDate);

        if (!list || list.length === 0) {
          if (idx !== -1) {
            existingData.splice(idx, 1);
            await AsyncStorage.setItem(month, JSON.stringify(existingData));
            await AsyncStorage.setItem(
              "LAST_DATA_UPDATE",
              Date.now().toString(),
            );
          }
          setTodaysExpenses([]);
          return true;
        }

        const totalExpense = list.reduce(
          (sum, item) => sum + (item.value || 0),
          0,
        );
        const payload: ReportData = {
          todaysDate,
          totalExpense: totalExpense.toString(),
          month,
          time: new Date().toISOString(),
          all: list.map((item) => ({
            id: item.id,
            name: item.name,
            value: item.value || 0,
            category: item.category || "other",
          })),
        };

        if (idx !== -1) {
          existingData[idx] = payload;
        } else {
          existingData.push(payload);
        }
        await AsyncStorage.setItem(month, JSON.stringify(existingData));
        await AsyncStorage.setItem("LAST_DATA_UPDATE", Date.now().toString());
        setTodaysExpenses(list);
        return true;
      } catch (error) {
        console.error("Error saving expenses:", error);
        return false;
      }
    },
    [todaysDate],
  );

  // --- Logic: Auto Save ---
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    // Save state even if empty (to reflect deletions)
    saveTodayExpenses(expList);
  }, [expList, saveTodayExpenses]);

  // --- Logic: Handlers ---
  const executeDelete = useCallback(
    async (itemToDelete: list) => {
      let updatedExpList;
      if (itemToDelete.id) {
        updatedExpList = expList.filter((item) => item.id !== itemToDelete.id);
      } else {
        updatedExpList = expList.filter(
          (item) => item.name !== itemToDelete.name,
        );
      }
      setExpList(updatedExpList);

      try {
        const storedPref = await AsyncStorage.getItem("perfer");
        const boxData = storedPref ? JSON.parse(storedPref) : [];

        let newPref;
        if (itemToDelete.id) {
          newPref = boxData.filter((item: any) => item.id !== itemToDelete.id);
        } else {
          newPref = boxData.filter(
            (item: any) => item.name !== itemToDelete.name,
          );
        }

        await AsyncStorage.setItem("perfer", JSON.stringify(newPref));
        setAllInputs(newPref);
      } catch (error) {
        console.error(error);
      }

      await saveTodayExpenses(updatedExpList);
      ToastAndroid.show("Deleted", ToastAndroid.SHORT);
    },
    [expList, saveTodayExpenses, setAllInputs, setExpList],
  );

  const handleDeleteExpense = useCallback(
    (item: list) => {
      setPendingDeleteItem(item);
      setItemToDelete(item.name); // For display in Alert
      setShowWarning("delete_transaction");
    },
    [setItemToDelete, setShowWarning],
  );

  // Effect to handle confirmation
  useEffect(() => {
    if (agree && showWarning === "delete_transaction" && pendingDeleteItem) {
      executeDelete(pendingDeleteItem);
      setAgree(false);
      setShowWarning(null);
      setPendingDeleteItem(null);
    }
  }, [
    agree,
    showWarning,
    pendingDeleteItem,
    executeDelete,
    setAgree,
    setShowWarning,
  ]);

  const totalToday = useMemo(() => {
    // Only count items in the active list
    return expList.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [expList]);

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />

      {/* Header Summary Card */}
      <View
        style={[
          styles.headerWrapper,
          { backgroundColor: themeColors.background },
        ]}
      >
        <View style={styles.summaryCardContainer}>
          <LinearGradient
            colors={["#1207a9", "#4d44af"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View>
              <Text style={styles.summaryLabel}>Total Expense Today</Text>
              <Text style={styles.summaryValue}>
                {currencySymbol}
                {totalToday.toFixed(2)}
              </Text>
            </View>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar" size={12} color="#4F46E5" />
              <Text style={styles.dateText}>
                {currentDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Expenses List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {expList.length > 0 ? (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Today&rsquo;s Transactions
              </Text>
              <View
                style={[
                  styles.listContainer,
                  { backgroundColor: themeColors.card },
                ]}
              >
                {expList.map((item, index) => (
                  <View key={index}>
                    <ExpenseRow
                      item={item}
                      onDelete={() => handleDeleteExpense(item)}
                      currencySymbol={currencySymbol}
                      themeColors={themeColors}
                    />
                    {index < expList.length - 1 && (
                      <View
                        style={[
                          styles.separator,
                          { backgroundColor: themeColors.border },
                        ]}
                      />
                    )}
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="wallet-outline" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyText}>No expenses today</Text>
              <Text style={styles.emptySubText}>
                Tap + to add a new expense
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handlePresentModalPress}
      >
        <LinearGradient
          colors={["#4F46E5", "#6366F1"]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <BottomSheet />
      <Alert
        title="Delete Transaction?"
        description="Are you sure you want to delete"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // Split styles: Container handles shadow/shape, Gradient handles content
  summaryCardContainer: {
    borderRadius: 20,
    backgroundColor: "#4F46E5", // Base color for shadow
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryGradient: {
    padding: 20,
    borderRadius: 20, // Match container
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    color: "#E0E7FF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dateText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    marginLeft: 4,
  },
  listContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 56, // indent to match text start
  },
  // Row Styles
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
    justifyContent: "center",
  },
  expenseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  // New Read-Only Badge Style
  amountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF", // Light blue tint
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
    minWidth: 70,
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  currencyPrefix: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 2,
    fontWeight: "500",
  },
  amountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubText: {
    fontSize: 14,
    color: "#6B7280",
  },
  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 28,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
