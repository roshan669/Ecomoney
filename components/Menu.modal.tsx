import {
  View,
  Text,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import React from "react";
import * as Print from "expo-print";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { ReportDataEntry } from "@/types/types";

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
  const [showMenu, setShowMenu] = React.useState<boolean>(false);

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
        backgroundColor: "#fff",
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setShowMenu((prev) => !prev);
        }}
        // style={{ padding: 10 }}
      >
        <Ionicons name="ellipsis-vertical" size={24} color="black" />
      </TouchableOpacity>
      <Modal
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
        transparent
        animationType="fade"
      >
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={printReport}
              disabled={reportData.length === 0}
            >
              <Ionicons
                name="share-social"
                size={20}
                color={reportData.length === 0 ? "#ccc" : "#333"}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[
                  styles.menuItemText,
                  reportData.length === 0 && styles.disabledText,
                ]}
              >
                Share Report
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={saveReportToDocuments}
              disabled={reportData.length === 0}
            >
              <Ionicons
                name="save"
                size={20}
                color={reportData.length === 0 ? "#ccc" : "#333"}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[
                  styles.menuItemText,
                  reportData.length === 0 && styles.disabledText,
                ]}
              >
                Save To File
              </Text>
            </TouchableOpacity>
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
    top: 55,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 180,
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
