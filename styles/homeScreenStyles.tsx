import { Colors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start", // Align items to the top
    flex: 1, // Ensure it takes full screen height
    backgroundColor: Colors.light.background, // Light background for the whole screen
    marginBottom: 20,
  },
  resultcontainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxHeight: 50, // Slightly smaller
    justifyContent: "space-around", // Better spacing
    paddingVertical: 10,
  },
  results: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxHeight: 55, // Slightly larger for results
    justifyContent: "space-around", // Better spacing
    backgroundColor: "#ffffff", // White background for contrast
    marginBottom: 15, // Space before input area
    paddingVertical: 10,
    borderBottomColor: Colors.light.icon,
    // borderBottomWidth: StyleSheet.hairlineWidth,s
  },
  inputcontainer: {
    backgroundColor: "#ffffff",
    width: "100%",
    flex: 1,
    borderRadius: 10,
    marginBottom: 5,
  },
  inputitems: {
    // Styles for the content inside ScrollView
    paddingVertical: 10, // Padding inside the scroll view
    alignItems: "center", // Center items horizontally
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%", // Width relative to the container
    marginBottom: 10,
    // minHeight: 70,
  },
  inputLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    // flex: 1, // Take up available space
  },
  deleteIcon: {
    marginLeft: 5,
  },
  input: {
    // Shared input styles
    height: 50,
    width: 150, // Fixed width for the input field
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: "#f1f3f5", // Very light gray background
    borderWidth: 1,
    borderColor: "#ced4da", // Subtle border
  },
  expenseInput: {
    // Specific styles for expense
    borderColor: "#e57373", // Light red border
  },
  incomeInput: {
    // Specific styles for income
    borderColor: "#81c784", // Light green border
  },
  addButtonContainer: {
    marginTop: 10, // Space above the add button
    // marginBottom: 20, // Space below the add button
  },
  addrmvbtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 56,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#212529",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  typeSelectionContainer: {
    marginBottom: 32,
  },
  typeButtonsRow: {
    flexDirection: "row",
    gap: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  expenseTypeButton: {
    backgroundColor: "#fff",
    borderColor: "#ffcdd2",
  },
  expenseTypeButtonSelected: {
    backgroundColor: "#ffebee",
    borderColor: "#ef5350",
    borderWidth: 2,
    elevation: 0, // Flat look for selected
  },
  incomeTypeButton: {
    backgroundColor: "#fff",
    borderColor: "#c8e6c9",
  },
  incomeTypeButtonSelected: {
    backgroundColor: "#e8f5e9",
    borderColor: "#66bb6a",
    borderWidth: 2,
    elevation: 0,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  typeButtonTextSelected: {
    color: "#212529",
    fontWeight: "700",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: "auto", // Push to bottom if container has height
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f3f5",
  },
  confirmButton: {
    backgroundColor: "#4F46E5",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // Keep modalcontainer for the warning modal
  modalcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Bottom Buttons Styling
  bottomButtonContainer: {
    gap: 20,
    flexDirection: "row", // Add some space above the split buttons
  },
  button: {
    // Shared button styles
    flexDirection: "row",
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 5, // Add horizontal margin between side-by-side buttons
  },
  calculateButton: {
    backgroundColor: "#6c757d", // Secondary/Gray color
    flex: 1, // Take half the space
  },
  insertButton: {
    backgroundColor: "#212529", // Success/Green color
    flex: 1, // Take half the space
  },
  reportButton: {
    backgroundColor: "#007bff", // Primary/Blue color
    width: "90%", // Full width button
    marginTop: 5, // Less margin for the bottom button
    marginBottom: 10,
  },
  buttonText: {
    // Renamed from 'text' to avoid conflict
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff", // White text for buttons
  },
  text: {
    // Style for regular text like labels
    fontSize: 16, // Adjusted size
    fontWeight: "500", // Medium weight
    color: "#495057", // Dark gray text
    textAlign: "center",
  },
  // Warning Modal Styles
  warningContent: {
    backgroundColor: "#ffffff",
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
    color: "#343a40",
    marginBottom: 5, // Less space before subtext
  },
  warningSubText: {
    fontSize: 16,
    textAlign: "center",
    color: "#6c757d", // Gray subtext
    marginBottom: 25, // More space before buttons
  },
  warningButtons: {
    flexDirection: "row",
    justifyContent: "space-around", // Spread buttons
    width: "100%", // Use full width
  },
  warningYesButton: {
    backgroundColor: "#28a745", // Green
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  warningNoButton: {
    backgroundColor: "#dc3545", // Red
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  warningButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
