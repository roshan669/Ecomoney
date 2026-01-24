import {
  View,
  Text,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import React, { useContext, useState } from "react";
import * as Print from "expo-print";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { HomeContext } from "@/hooks/useHome";
import { currencies } from "@/constants/categories";

interface menuProps {
  reportData: any[];
  selectedMonthTitle: string;
  generateHTML: () => string;
}

export default function Menu({
  reportData,
  generateHTML,
  selectedMonthTitle,
}: menuProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState<boolean>(false);
  const { currencySymbol, setCurrencySymbol, theme, toggleTheme, themeColors } =
    useContext(HomeContext);

  const printReport = async () => {
    setShowMenu(false);
    if (reportData.length === 0) {
      ToastAndroid.show(
        "No data to print for the selected month",
        ToastAndroid.SHORT,
      );
      return;
    }
    const html = generateHTML();
    try {
      const { uri } = await Print.printToFileAsync({
        html,
      });

      const fileName = `Ecomoney_Report_${selectedMonthTitle.replace(
        / /g,
        "_",
      )}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      await Sharing.shareAsync(newUri, {
        mimeType: "application/pdf",
        dialogTitle: `Share Report for ${selectedMonthTitle}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("(Report.js) Error printing report:", error);
      ToastAndroid.show("Failed to print report", ToastAndroid.SHORT);
    }
  };

  const saveReportToDocuments = async () => {
    setShowMenu(false);
    if (reportData.length === 0) {
      ToastAndroid.show(
        "No data to save for the selected month",
        ToastAndroid.SHORT,
      );
      return;
    }

    if (Platform.OS === "android") {
      try {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const html = generateHTML();
          const { uri } = await Print.printToFileAsync({ html });
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const fileName = `Ecomoney_Report_${selectedMonthTitle.replace(
            / /g,
            "_",
          )}.pdf`;
          const mimeType = "application/pdf";

          const newFileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              mimeType,
            );
          await FileSystem.writeAsStringAsync(newFileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          ToastAndroid.show("Report saved successfully", ToastAndroid.SHORT);
        } else {
          ToastAndroid.show("Permission denied", ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error("(Report.js) Error saving report:", error);
        ToastAndroid.show("Error saving report", ToastAndroid.SHORT);
      }
    } else {
      // For iOS, shareAsync is the standard way to save to files
      printReport();
    }
  };
  return (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: "#fff", // Removed hardcoded background
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setShowMenu((prev) => !prev);
        }}
        // style={{ padding: 10 }}
      >
        <Ionicons name="ellipsis-vertical" size={24} color={themeColors.text} />
      </TouchableOpacity>
      <Modal
        visible={showMenu}
        onRequestClose={() => {
          setShowMenu(false);
          setShowCurrencyMenu(false);
        }}
        transparent
        animationType="fade"
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setShowMenu(false);
            setShowCurrencyMenu(false);
          }}
        >
          <View
            style={[
              styles.actionButtonsContainer,
              { backgroundColor: themeColors.card },
            ]}
          >
            {!showCurrencyMenu ? (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={printReport}
                  disabled={reportData.length === 0}
                >
                  <Ionicons
                    name="share-social"
                    size={20}
                    color={
                      reportData.length === 0
                        ? themeColors.seconday
                        : themeColors.text
                    }
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: themeColors.text },
                      reportData.length === 0 && styles.disabledText,
                    ]}
                  >
                    Share Report
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: themeColors.border },
                  ]}
                />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={saveReportToDocuments}
                  disabled={reportData.length === 0}
                >
                  <Ionicons
                    name="save"
                    size={20}
                    color={
                      reportData.length === 0
                        ? themeColors.seconday
                        : themeColors.text
                    }
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: themeColors.text },
                      reportData.length === 0 && styles.disabledText,
                    ]}
                  >
                    Save To File
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: themeColors.border },
                  ]}
                />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setShowCurrencyMenu(true)}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={themeColors.text}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[styles.menuItemText, { color: themeColors.text }]}
                  >
                    Change Currency
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: themeColors.border },
                  ]}
                />

                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={1}
                  onPress={toggleTheme}
                >
                  <Ionicons
                    name={theme === "dark" ? "moon" : "sunny-outline"}
                    size={20}
                    color={themeColors.text}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      { flex: 1, color: themeColors.text },
                    ]}
                  >
                    Dark Mode
                  </Text>
                  <Switch
                    value={theme === "dark"}
                    onValueChange={toggleTheme}
                    thumbColor={theme === "dark" ? "#f4f3f4" : "#f4f3f4"}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    { backgroundColor: themeColors.border },
                  ]}
                  onPress={() => setShowCurrencyMenu(false)}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={themeColors.text}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[styles.menuItemText, { color: themeColors.text }]}
                  >
                    Back
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: themeColors.border },
                  ]}
                />
                {currencies.map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={styles.menuItem}
                    onPress={() => {
                      setCurrencySymbol(curr);
                      setShowCurrencyMenu(false);
                      setShowMenu(false);
                      ToastAndroid.show(
                        `Currency changed to ${curr}`,
                        ToastAndroid.SHORT,
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        {
                          fontWeight:
                            curr === currencySymbol ? "bold" : "normal",
                          flex: 1,
                          color: themeColors.text,
                        },
                      ]}
                    >
                      {curr}
                    </Text>
                    {curr === currencySymbol && (
                      <Ionicons name="checkmark" size={18} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  actionButtonsContainer: {
    position: "absolute",
    top: 90,
    right: 15,
    backgroundColor: "#fff", // Fallback, overridden by style prop
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 200,
    paddingVertical: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
  disabledText: {
    color: "#ccc",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 10,
  },
});
