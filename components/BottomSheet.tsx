import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  Button,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { styles } from "@/styles/homeScreenStyles";
import { HomeContext } from "@/hooks/useHome";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  getCategoryColor,
  expenseCategoriesList,
} from "@/constants/categories";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadModel, predictCategory } from "@/utils/ExpenseClassifier";
import { saveCategoryCorrection, getLearnedCategory } from "@/utils/CategoryLearning";

export default function BottomSheet() {
  const amountInputRef = React.useRef<any>(null);
  const inset = useSafeAreaInsets();

  const [nameError, setNameError] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 60,
    overshootClamping: true,
    // restDisplacementThreshold: 0.1,
    // restSpeedThreshold: 0.1,
    stiffness: 350,
  });
  const [prediction, setPrediction] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [initialPrediction, setInitialPrediction] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleSheetClose();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );
  const handleSheetChanges = React.useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const {
    bottomSheetModalRef,
    addName,
    setAddName,
    addAmount,
    setAddAmount,
    setPerfer,
    perfer,
    handleAdd,
    currencySymbol,
    themeColors,
  } = useContext(HomeContext);

  useEffect(() => {
    loadModel();
  }, []);

  const handlePredict = async () => {
    if (!addName.trim() || isPredicting) return;
    setIsPredicting(true);
    setPrediction("Analyzing...");
    try {
      // Check learned corrections first
      const learned = await getLearnedCategory(addName);
      let categoryToUse = learned;
      
      if (!learned) {
        // Use ML model if no learned correction
        const result = await predictCategory(addName);
        categoryToUse = result.category;
      }
      
      setPrediction(`Suggested: ${categoryToUse}`);
      setInitialPrediction(categoryToUse || "");
      
      // Auto-select category
      const matchedCategory = expenseCategoriesList.find(
        (cat) => cat.label.toLowerCase() === categoryToUse?.toLowerCase(),
      );
      if (matchedCategory) {
        setPerfer(matchedCategory.key);
      }
    } catch (error) {
      console.error("❌ Prediction failed:", error);
      setPrediction("Prediction failed. Try again.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handeleAddExpense = async () => {
    if (!addName.trim()) {
      setNameError("Please enter a expense name.");
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
    
    // Save correction if user changed the predicted category
    if (initialPrediction && perfer && initialPrediction.toLowerCase() !== perfer.toLowerCase()) {
      const categoryLabel = expenseCategoriesList.find(c => c.key === perfer)?.label || perfer;
      await saveCategoryCorrection(addName, initialPrediction, categoryLabel);
    }
    
    handleAdd();
    setInitialPrediction("");
  };

  const handleSheetClose = React.useCallback(() => {
    (bottomSheetModalRef as any)?.current?.close();
  }, []);

  const renderBackdrop = React.useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        enableTouchThrough={false}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      animationConfigs={animationConfigs}
      ref={bottomSheetModalRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      enablePanDownToClose={true}
      // snapPoints={["85%"]}
      // enableDynamicSizing
      animateOnMount={true}
      enableDismissOnClose={true}
      bottomInset={inset.bottom}
      backgroundStyle={{ backgroundColor: themeColors.card }}
      handleIndicatorStyle={{ backgroundColor: themeColors.icon }}
    >
      <BottomSheetScrollView
        style={{ flex: 1, backgroundColor: themeColors.card }}
        keyboardShouldPersistTaps="handled"
      >
        <BottomSheetView
          style={[
            styles.modalContentContainer,
            { backgroundColor: themeColors.card },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: themeColors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Add Expense
            </Text>
          </View>

          <View style={styles.modalInputContainer}>
            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>
              Expense Name
            </Text>
            <BottomSheetTextInput
              placeholder="e.g., Groceries, Taxi, Dinner"
              value={addName}
              onChangeText={setAddName}
              onFocus={() => setNameError("")}
              onBlur={handlePredict}
              style={[
                styles.modalInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              placeholderTextColor={themeColors.subText}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => amountInputRef.current?.focus()}
            />
            {nameError ? (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                {nameError}
              </Text>
            ) : null}
          </View>

          <View style={styles.modalInputContainer}>
            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>
              Amount
            </Text>
            <BottomSheetTextInput
              ref={amountInputRef}
              onFocus={() => setAmountError("")}
              placeholder={`${currencySymbol}0`}
              value={addAmount}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, "");
                setAddAmount(numeric);
              }}
              style={[
                styles.modalInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              keyboardType="numeric"
              placeholderTextColor={themeColors.subText}
              returnKeyType="done"
            />
            {amountError ? (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                {amountError}
              </Text>
            ) : null}
          </View>

          <View style={styles.typeSelectionContainer}>
            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>
              Category
            </Text>
            {prediction && (
              <Text
                style={{
                  color: themeColors.subText,
                  marginVertical: 5,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {prediction}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 8,
              }}
            >
              {expenseCategoriesList.map((category) => {
                const color = getCategoryColor(category.key);
                const isSelected = perfer === category.key;
                return (
                  <TouchableOpacity
                    key={category.key}
                    onPress={() => setPerfer(category.key)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isSelected
                        ? color
                        : themeColors.background,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      minWidth: "30%",
                      gap: 8,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: isSelected
                        ? "transparent"
                        : themeColors.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={category.icon}
                      size={20}
                      color={isSelected ? "#fff" : color}
                    />
                    <Text
                      style={{
                        color: isSelected ? "#fff" : themeColors.text,
                        fontSize: 14,
                        fontWeight: isSelected ? "600" : "500",
                      }}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.cancelButton,
                { backgroundColor: themeColors.background },
              ]}
              onPress={() => {
                handleSheetClose();
                setAddName("");
                setAddAmount("");
                setPerfer("");
                setNameError("");
                setAmountError("");
                setPrediction("");
              }}
            >
              <Text
                style={[styles.cancelButtonText, { color: themeColors.text }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handeleAddExpense}
            >
              <Text style={styles.confirmButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
