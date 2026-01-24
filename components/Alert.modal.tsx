import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import React, { useContext } from "react";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { HomeContext } from "@/hooks/useHome";
import { Colors } from "@/constants/theme";

interface AlertProps {
  title: string;
  description: string;
}

export default function Alert({ title, description }: AlertProps) {
  const {
    itemToDelete,
    setShowWarning,
    setAgree,
    setDataToUpdate,
    showWarning,
    themeColors,
    theme,
  } = useContext(HomeContext);
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showWarning ? true : false}
      onRequestClose={() => {
        setShowWarning(null);
        setAgree(false); // Ensure agree is false if closed without choice
        setDataToUpdate!(null); // Clear pending data
      }}
      statusBarTranslucent
    >
      <BlurView
        style={styles.modalcontainer}
        intensity={theme === "dark" ? 50 : 100}
        tint={
          theme === "dark"
            ? "systemChromeMaterialDark"
            : "systemChromeMaterialLight"
        }
      >
        <View
          style={[styles.warningContent, { backgroundColor: themeColors.card }]}
        >
          <Ionicons
            name="warning-outline"
            size={40}
            color={themeColors.danger}
            style={{ marginBottom: 10 }}
          />
          <Text style={[styles.warningText, { color: themeColors.text }]}>
            {title}
          </Text>
          <Text style={[styles.warningSubText, { color: themeColors.subText }]}>
            {description}
            {(showWarning === "delete" ||
              showWarning === "delete_transaction") &&
            itemToDelete
              ? ` "${itemToDelete}"?`
              : ""}
          </Text>
          <View style={styles.warningButtons}>
            <TouchableOpacity
              style={[
                styles.warningNoButton,
                { backgroundColor: themeColors.border },
              ]} // "No" on the left
              onPress={() => {
                setShowWarning(null);
                setAgree(false); // Explicitly set agree to false
                setDataToUpdate!(null); // Clear pending data
                // ToastAndroid.show("Operation cancelled", ToastAndroid.SHORT);
              }}
            >
              <Text
                style={[styles.warningButtonText, { color: themeColors.text }]}
              >
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.warningYesButton,
                { backgroundColor: themeColors.danger },
              ]} // "Yes" on the right
              onPress={() => {
                // Just set agree and close. The useEffect will handle the update.
                setAgree(true);
              }}
            >
              <Text style={[styles.warningButtonText, { color: "#fff" }]}>
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  warningContent: {
    padding: 30, // More padding
    borderRadius: 15,
    alignItems: "center",
    width: "85%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5, // Less space before subtext
  },
  warningSubText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25, // More space before buttons
  },
  warningButtons: {
    flexDirection: "row",
    justifyContent: "space-around", // Spread buttons
    width: "100%", // Use full width
  },
  warningYesButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  warningNoButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  warningButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
