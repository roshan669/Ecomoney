import { View, Text, TouchableOpacity, BackHandler } from "react-native";
import React, { useContext } from "react";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { styles } from "@/styles/homeScreenStyles";
import { HomeContext } from "@/hooks/useHome";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import type { ExpenseCategory } from "@/types/types";

const expenseCategories: { key: ExpenseCategory; label: string; icon: any }[] =
  [
    { key: "food", label: "Food", icon: "restaurant-outline" },
    { key: "transport", label: "Transport", icon: "car-outline" },
    { key: "shopping", label: "Shopping", icon: "cart-outline" },
    {
      key: "entertainment",
      label: "Entertainment",
      icon: "game-controller-outline",
    },
    { key: "bills", label: "Bills", icon: "receipt-outline" },
    { key: "health", label: "Health", icon: "medical-outline" },
    { key: "education", label: "Education", icon: "school-outline" },
    {
      key: "other",
      label: "Other",
      icon: "ellipsis-horizontal-circle-outline",
    },
  ];

export default function BottomSheet() {
  const amountInputRef = React.useRef<any>(null);

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
  } = useContext(HomeContext);

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
      ref={bottomSheetModalRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enablePanDownToClose={true}
      snapPoints={["75%"]}
      animateOnMount={true}
      enableDismissOnClose={true}
    >
      <BottomSheetScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <BottomSheetView style={styles.modalContentContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
          </View>

          <View style={styles.modalInputContainer}>
            <Text style={styles.inputLabel}>Expense Name</Text>
            <BottomSheetTextInput
              placeholder="e.g., Groceries, Taxi, Dinner"
              value={addName}
              onChangeText={setAddName}
              style={styles.modalInput}
              autoCapitalize="words"
              placeholderTextColor="#adb5bd"
              returnKeyType="next"
              onSubmitEditing={() => amountInputRef.current?.focus()}
            />
          </View>

          <View style={styles.modalInputContainer}>
            <Text style={styles.inputLabel}>Amount</Text>
            <BottomSheetTextInput
              ref={amountInputRef}
              placeholder="₹0"
              value={addAmount}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, "");
                setAddAmount(numeric);
              }}
              style={styles.modalInput}
              keyboardType="numeric"
              placeholderTextColor="#adb5bd"
              returnKeyType="done"
            />
          </View>

          <View style={styles.typeSelectionContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 8,
              }}
            >
              {expenseCategories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => setPerfer(category.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor:
                      perfer === category.key ? "#6366f1" : "#f3f4f6",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    minWidth: "30%",
                    gap: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={perfer === category.key ? "#fff" : "#6b7280"}
                  />
                  <Text
                    style={{
                      color: perfer === category.key ? "#fff" : "#374151",
                      fontSize: 14,
                      fontWeight: perfer === category.key ? "600" : "500",
                    }}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                handleSheetClose();
                setAddName("");
                setAddAmount("");
                setPerfer("");
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleAdd}
            >
              <Text style={styles.confirmButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
