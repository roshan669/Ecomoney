import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeContext } from "@/hooks/useHome";
import {
  getCategoryColor,
  expenseCategoriesList,
} from "@/constants/categories";
import { loadModel, predictCategory } from "@/utils/ExpenseClassifier";
import {
  saveCategoryCorrection,
  getLearnedCategory,
} from "@/utils/CategoryLearning";

export default function AddExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const nameInputRef = useRef<TextInput>(null);
  const defaultStyles = useDefaultStyles();

  const [nameError, setNameError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [prediction, setPrediction] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [initialPrediction, setInitialPrediction] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    addName,
    setAddName,
    addAmount,
    setAddAmount,
    setPerfer,
    perfer,
    handleAdd,
    currencySymbol,
    themeColors,
    theme,
    selectedDate,
    setSelectedDate,
  } = useContext(HomeContext);

  useEffect(() => {
    loadModel();
  }, []);

  const handlePredict = async () => {
    if (!addName.trim() || isPredicting) return;
    setIsPredicting(true);
    setPrediction("Analyzing...");
    try {
      const learned = await getLearnedCategory(addName);
      let categoryToUse = learned;
      if (!learned) {
        const result = await predictCategory(addName);
        categoryToUse = result.category;
      }
      setPrediction(`Suggested: ${categoryToUse}`);
      setInitialPrediction(categoryToUse || "");
      const matchedCategory = expenseCategoriesList.find(
        (cat) => cat.label.toLowerCase() === categoryToUse?.toLowerCase(),
      );
      if (matchedCategory) setPerfer(matchedCategory.key);
    } catch {
      setPrediction("Prediction failed. Try again.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSubmit = async () => {
    if (!addName.trim()) {
      setNameError("Please enter an expense name.");
      return;
    }
    setNameError("");
    if (
      !addAmount.trim() ||
      isNaN(Number(addAmount)) ||
      Number(addAmount) <= 0
    ) {
      setAmountError("Please enter a valid amount greater than zero.");
      return;
    }
    setAmountError("");
    if (
      initialPrediction &&
      perfer &&
      initialPrediction.toLowerCase() !== perfer.toLowerCase()
    ) {
      const categoryLabel =
        expenseCategoriesList.find((c) => c.key === perfer)?.label ?? perfer;
      await saveCategoryCorrection(addName, initialPrediction, categoryLabel);
    }
    const success = await handleAdd();
    if (success) {
      setInitialPrediction("");
      router.back();
    }
  };

  const handleCancel = () => {
    setAddName("");
    setAddAmount("");
    setPerfer("");
    setNameError("");
    setAmountError("");
    setPrediction("");
    router.back();
  };

  const accentColor = perfer ? getCategoryColor(perfer) : "#4F46E5";

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      ── Header ── */
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top,
            backgroundColor: themeColors.background,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleCancel} style={s.iconBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: themeColors.text }]}>
          Add Expense
        </Text>
        <View style={s.iconBtn} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.scrollContent,
          { backgroundColor: themeColors.background },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/*  ── Amount hero ── */}
        <View
          style={[
            s.amountCard,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[s.fieldLabel, { color: themeColors.subText }]}>
            AMOUNT
          </Text>
          <View style={s.amountRow}>
            <Text style={[s.currencySymbol, { color: themeColors.subText }]}>
              {currencySymbol}
            </Text>
            <TextInput
              placeholder="0"
              value={addAmount}
              onChangeText={(text) => setAddAmount(text.replace(/[^0-9]/g, ""))}
              onFocus={() => setAmountError("")}
              style={[s.amountInput, { color: themeColors.text }]}
              keyboardType="numeric"
              placeholderTextColor={themeColors.subText}
              returnKeyType="next"
              onSubmitEditing={() => nameInputRef.current?.focus()}
            />
          </View>
          {amountError ? <Text style={s.errorText}>{amountError}</Text> : null}
        </View>

        {/* ── Expense name ── */}
        <View style={s.section}>
          <Text style={[s.fieldLabel, { color: themeColors.subText }]}>
            EXPENSE NAME
          </Text>
          <TextInput
            ref={nameInputRef}
            placeholder="e.g., Groceries, Taxi, Dinner"
            value={addName}
            onChangeText={setAddName}
            onFocus={() => setNameError("")}
            onBlur={handlePredict}
            style={[
              s.input,
              {
                color: themeColors.text,
                backgroundColor: themeColors.card,
                borderColor: nameError ? "#EF4444" : themeColors.border,
              },
            ]}
            placeholderTextColor={themeColors.subText}
            autoCapitalize="words"
            returnKeyType="done"
          />
          {nameError ? <Text style={s.errorText}>{nameError}</Text> : null}
        </View>

        {/* ── Date ── */}
        <View style={s.section}>
          <Text style={[s.fieldLabel, { color: themeColors.subText }]}>
            DATE
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              s.dateRow,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={themeColors.subText}
            />
            <Text style={[s.dateRowText, { color: themeColors.text }]}>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year:
                  selectedDate.getFullYear() !== new Date().getFullYear()
                    ? "numeric"
                    : undefined,
              })}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={themeColors.subText}
            />
          </TouchableOpacity>
        </View>

        {/* ── Category ── */}
        <View
          style={[
            s.section,
            {
              // backgroundColor: themeColors.card,
              // padding: 10,
              // borderRadius: 12,
            },
          ]}
        >
          <View style={s.categoryHeader}>
            <Text style={[s.fieldLabel, { color: themeColors.subText }]}>
              CATEGORY
            </Text>
            {prediction ? (
              <View
                style={[
                  s.predictionBadge,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Ionicons name="sparkles" size={12} color="#4F46E5" />
                <Text
                  style={[s.predictionText, { color: themeColors.subText }]}
                >
                  {prediction}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={s.categoryGrid}>
            {expenseCategoriesList.map((category) => {
              const color = getCategoryColor(category.key);
              const isSelected = perfer === category.key;
              return (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => setPerfer(category.key)}
                  style={[
                    s.categoryChip,
                    {
                      backgroundColor: isSelected
                        ? color
                        : themeColors.background,
                      borderColor: isSelected ? color : themeColors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.chipIconWrap,
                      {
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.25)"
                          : `${color}22`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={category.icon}
                      size={18}
                      color={isSelected ? "#fff" : color}
                    />
                  </View>
                  <Text
                    style={[
                      s.chipLabel,
                      { color: isSelected ? "#fff" : themeColors.text },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: accentColor }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={s.submitBtnText}>Add Expense</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 8 }} />
      </ScrollView>
      {/* ── Date Picker Modal ── */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={s.datePickerOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable
            style={[
              s.datePickerContainer,
              { backgroundColor: themeColors.card },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                s.datePickerHeader,
                { borderBottomColor: themeColors.border },
              ]}
            >
              <Text style={[s.datePickerTitle, { color: themeColors.text }]}>
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
                  setSelectedDate(dayjs(params.date).toDate());
                  setShowDatePicker(false);
                }
              }}
              styles={{
                ...defaultStyles,
                today: { borderColor: "#4F46E5", borderWidth: 1 },
                today_label: { color: themeColors.text },
                selected: { backgroundColor: "#4F46E5" },
                selected_label: { color: "#FFFFFF" },
                day_label: { color: themeColors.text },
                weekday_label: { color: themeColors.text },
                month_selector_label: { color: themeColors.text },
                year_selector_label: { color: themeColors.text },
                selected_year: { backgroundColor: "#4F46E5" },
                selected_month: { backgroundColor: "#4F46E5" },
                year: {
                  color: "#fff",
                  backgroundColor:
                    theme === "dark"
                      ? themeColors.subText
                      : themeColors.seconday,
                  borderRadius: 12,
                },
                month: {
                  color: "#fff",
                  backgroundColor:
                    theme === "dark"
                      ? themeColors.subText
                      : themeColors.seconday,
                  borderRadius: 12,
                },
              }}
            />
            <TouchableOpacity
              style={[s.todayButton, { backgroundColor: "#4F46E5" }]}
              onPress={() => {
                setSelectedDate(new Date());
                setShowDatePicker(false);
              }}
            >
              <Text style={s.todayButtonText}>Go to Today</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "space-between",
    gap: 5,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    flexGrow: 1,
  },
  amountCard: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 6,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: "700",
    padding: 0,
    letterSpacing: -1,
  },
  section: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  predictionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  predictionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    width: "47.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 16,
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  dateRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
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
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  todayButton: {
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
