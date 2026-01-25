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
  Modal,
  Pressable,
} from "react-native";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import dayjs from "dayjs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { list } from "@/types/types";
import { HomeContext } from "@/hooks/useHome";
import { useExpenses } from "@/hooks/useExpenses";
import { useFocusEffect } from "expo-router";
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
  const defaultStyles = useDefaultStyles();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

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
    incrementDbVersion,
  } = useContext(HomeContext)!;

  // Database hook for expense management
  const { addExpense, deleteExpenseItem, loadExpenses } = useExpenses();
  const [pendingDeleteItem, setPendingDeleteItem] = useState<list | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const lastSavedHash = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Animation for list entry
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // --- Load expenses from database for the selected date ---
  const loadExpensesForDate = useCallback(
    async (date: Date) => {
      try {
        // Format date as YYYY-MM-DD using local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        console.log("Loading expenses from database for date:", dateStr);

        const allExpenses = await loadExpenses();
        console.log("All expenses loaded:", allExpenses);

        const dateExpenses = allExpenses.filter((exp) => exp.date === dateStr);
        console.log("Expenses for date:", dateExpenses);

        const listFormat = dateExpenses.map((exp) => ({
          id: exp.id?.toString(),
          name: exp.name,
          value: exp.value,
          category: exp.category,
        }));

        console.log("Setting expenses from database:", listFormat);
        setExpList(listFormat);
        await AsyncStorage.setItem("perfer", JSON.stringify(listFormat));
        setAllInputs(listFormat);
      } catch (error) {
        console.error("Error loading expenses from database:", error);
      }
    },
    [loadExpenses, setExpList, setAllInputs],
  );

  // --- Load today's expenses from database on mount and when screen is focused ---
  useFocusEffect(
    useCallback(() => {
      // Always load on first focus, then skip if already loaded
      if (hasLoadedRef.current) {
        return;
      }

      const loadTodaysExpensesFromDb = async () => {
        try {
          // Format date as YYYY-MM-DD using local date components
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
          const day = String(selectedDate.getDate()).padStart(2, "0");
          const today = `${year}-${month}-${day}`;
          console.log("useFocusEffect: Loading expenses for date:", today);

          // Wait longer initially for database to fully initialize
          await new Promise((resolve) => setTimeout(resolve, 1200));

          const allExpenses = await loadExpenses();
          console.log(
            "useFocusEffect: Got expenses from DB:",
            allExpenses.length,
          );

          const dbTodaysExpenses = allExpenses.filter(
            (exp) => exp.date === today,
          );
          console.log(
            "useFocusEffect: Today's expenses:",
            dbTodaysExpenses.length,
          );

          const listFormat = dbTodaysExpenses.map((exp) => ({
            id: exp.id?.toString(),
            name: exp.name,
            value: exp.value,
            category: exp.category,
          }));

          // Always set expenses from database (database is source of truth)
          console.log("useFocusEffect: Setting expenses:", listFormat.length);
          setExpList(listFormat);
          await AsyncStorage.setItem("perfer", JSON.stringify(listFormat));
          setAllInputs(listFormat);

          setDbInitialized(true);
          hasLoadedRef.current = true;
        } catch (error) {
          console.error("Error loading expenses from database:", error);
          // Don't mark as loaded on error - let backup loader try
        }
      };

      loadTodaysExpensesFromDb();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Backup: Always reload after database is definitely initialized
  useEffect(() => {
    const timer = setTimeout(async () => {
      console.log("Backup loader: Reloading today's expenses...");
      try {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const today = `${year}-${month}-${day}`;

        const allExpenses = await loadExpenses();
        console.log("Backup loader: Got expenses:", allExpenses.length);

        const dbTodaysExpenses = allExpenses.filter(
          (exp) => exp.date === today,
        );

        const listFormat = dbTodaysExpenses.map((exp) => ({
          id: exp.id?.toString(),
          name: exp.name,
          value: exp.value,
          category: exp.category,
        }));

        // Update if we found expenses OR if nothing was loaded yet
        if (listFormat.length > 0 || !hasLoadedRef.current) {
          console.log("Backup loader: Setting expenses:", listFormat.length);
          setExpList(listFormat);
          await AsyncStorage.setItem("perfer", JSON.stringify(listFormat));
          setAllInputs(listFormat);
        }

        hasLoadedRef.current = true;
        setDbInitialized(true);
      } catch (error) {
        console.error("Backup loader error:", error);
      }
    }, 2500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Daily Reset Logic ---
  useEffect(() => {
    const checkDailyReset = async () => {
      try {
        const today = new Date().toDateString();
        const lastResetDate = await AsyncStorage.getItem("LAST_RESET_DATE");

        if (lastResetDate !== today) {
          // New Day Detected: Clear current session expenses from AsyncStorage
          // Note: Do NOT clear the database - it persists across days
          await AsyncStorage.setItem("perfer", "[]");

          // Only reset UI if we haven't loaded from DB yet
          if (!hasLoadedRef.current) {
            setAllInputs([]);
            setExpList([]);
          }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expList.length]);

  const handlePresentModalPress = useCallback(() => {
    inputRefs.current.forEach((input) => input?.blur());
    (bottomSheetModalRef as any).current?.present();
  }, [bottomSheetModalRef, inputRefs]);

  // --- Logic: Save Expenses to Database Only ---
  const saveTodayExpenses = useCallback(
    async (list: list[]) => {
      // Format date as YYYY-MM-DD using local date components
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      console.log("Saving expenses for date:", dateStr, "Items:", list.length);

      try {
        // Save each NEW expense to database (skip if already has numeric DB ID)
        for (const item of list) {
          console.log("Checking item:", {
            name: item.name,
            value: item.value,
            category: item.category,
            id: item.id,
            hasName: !!item.name,
            hasValue: item.value !== undefined && item.value !== null,
            hasCategory: !!item.category,
            hasId: !!item.id,
            isNumericId: item.id ? /^\d+$/.test(item.id) : false,
          });

          // Check: has name, has value (including 0), has category
          // AND either no ID or has a non-numeric (client-generated) ID
          const hasNumericDbId = item.id && /^\d+$/.test(item.id);

          if (
            item.name &&
            item.category &&
            item.value !== undefined &&
            item.value !== null &&
            !hasNumericDbId
          ) {
            try {
              console.log("Adding expense to DB:", item);
              const result = await addExpense({
                name: item.name,
                category: item.category,
                value: item.value,
                date: dateStr,
              });
              console.log("Expense added successfully:", result);
              incrementDbVersion(); // Notify that database changed
            } catch (err) {
              console.error("Error adding expense to database:", err);
            }
          } else {
            console.log(
              "Skipping item - already in DB or invalid",
              item.name,
              item.value,
              item.category,
              item.id,
            );
          }
        }
        return true;
      } catch (error) {
        console.error("Error saving expenses:", error);
        return false;
      }
    },
    [selectedDate, addExpense, incrementDbVersion],
  );

  // --- Logic: Auto Save (without triggering infinite loops) ---
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    // Don't save until database is initialized
    if (!dbInitialized) {
      return;
    }

    // Prevent infinite loops by skipping identical payloads
    const serialized = JSON.stringify(
      expList.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        category: item.category,
      })),
    );

    if (serialized === lastSavedHash.current) {
      return;
    }

    lastSavedHash.current = serialized;

    // Save to persistence
    const saveAsync = async () => {
      await saveTodayExpenses(expList);
    };
    saveAsync();
  }, [expList, dbInitialized]);

  // --- Logic: Handlers ---
  const executeDelete = useCallback(
    async (itemToDelete: list) => {
      let updatedExpList;
      if (itemToDelete.id) {
        updatedExpList = expList.filter((item) => item.id !== itemToDelete.id);
        // Delete from database if it has an ID
        try {
          await deleteExpenseItem(parseInt(itemToDelete.id));
          incrementDbVersion(); // Notify that database changed
        } catch (err) {
          console.error("Error deleting from database:", err);
        }
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

      // Don't call saveTodayExpenses here - the auto-save useEffect will handle it
      ToastAndroid.show("Deleted", ToastAndroid.SHORT);
    },
    [expList, setAllInputs, setExpList, deleteExpenseItem],
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
        <TouchableOpacity
          style={styles.summaryCardContainer}
          activeOpacity={0.9}
          onPress={() => setShowDatePicker(true)}
        >
          <LinearGradient
            colors={["#1207a9", "#4d44af"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View>
              <Text style={styles.summaryLabel}>
                {isToday ? "Total Expense Today" : "Total Expense"}
              </Text>
              <Text style={styles.summaryValue}>
                {currencySymbol}
                {totalToday.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dateBadge}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={12} color="#4F46E5" />
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year:
                    selectedDate.getFullYear() !== new Date().getFullYear()
                      ? "numeric"
                      : undefined,
                })}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#4F46E5" />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={styles.datePickerOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable
            style={[
              styles.datePickerContainer,
              { backgroundColor: themeColors.card },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.datePickerHeader}>
              <Text
                style={[styles.datePickerTitle, { color: themeColors.text }]}
              >
                Select Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={themeColors.subText} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              mode="single"
              date={selectedDate}
              onChange={(params) => {
                if (params.date) {
                  const newDate = dayjs(params.date).toDate();
                  setSelectedDate(newDate);
                  loadExpensesForDate(newDate);
                  setShowDatePicker(false);
                }
              }}
              styles={{
                ...defaultStyles,
                today: { borderColor: "#4F46E5", borderWidth: 1 },
                selected: { backgroundColor: "#4F46E5" },
                selected_label: { color: "#FFFFFF" },
                day_label: { color: themeColors.text },
                weekday_label: { color: themeColors.subText },
                month_selector_label: { color: themeColors.text },
                year_selector_label: { color: themeColors.text },
              }}
            />
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                const today = new Date();
                setSelectedDate(today);
                loadExpensesForDate(today);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.todayButtonText}>Go to Today</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
                {isToday
                  ? "Today's Transactions"
                  : `Transactions for ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
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
              <Text style={styles.emptyText}>
                {isToday ? "No expenses today" : "No expenses for this date"}
              </Text>
              <Text style={styles.emptySubText}>
                {isToday
                  ? "Tap + to add a new expense"
                  : "Select today to add expenses"}
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
  // Date Picker Modal Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerContainer: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  todayButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  todayButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
