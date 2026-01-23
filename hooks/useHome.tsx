import { input, list, ReportData } from "@/types/types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { ToastAndroid } from "react-native";
import { TextInput } from "react-native-gesture-handler";

interface HomeContextType {
  netIncome: string;
  setNetIncome: (value: string) => void;
  totalGrossIncome: string;
  setTotalGrossIncome: (value: string) => void;
  expList: list[];
  setExpList: (value: list[]) => void;
  incList: list[];
  setIncList: (value: list[]) => void;
  perfer: string;
  setPerfer: (value: string) => void;
  allinputs: input[];
  setAllInputs: (value: input[]) => void;
  showWarning: string | null;
  setShowWarning: (value: string | null) => void;
  agree: boolean;
  setAgree: (value: boolean) => void;
  dataToUpdate: ReportData | null;
  setDataToUpdate: (value: ReportData | null) => void;
  itemToDelete: string;
  setItemToDelete: (value: string) => void;
  setAddName: (value: string) => void;
  addName: string;
  addAmount: string;
  setAddAmount: (value: string) => void;
  bottomSheetModalRef: React.Ref<any>;
  handleAdd: () => void;
  inputRefs: React.RefObject<(TextInput | null)[]>;
}

const HomeContext = createContext<HomeContextType>({
  netIncome: "0",
  setNetIncome: () => {
    console.log("wrap the layot with useHome provider");
  },
  totalGrossIncome: "0",
  setTotalGrossIncome: () => {
    console.log("wrap the layot with useHome provider");
  },
  expList: [],
  setExpList: () => {
    console.log("wrap the layot with useHome provider");
  },
  incList: [],
  setIncList: () => {
    console.log("wrap the layot with useHome provider");
  },
  perfer: "",
  setPerfer: () => {
    console.log("wrap the layot with useHome provider");
  },
  allinputs: [],
  setAllInputs: () => {
    console.log("wrap the layot with useHome provider");
  },
  showWarning: null,
  setShowWarning: () => {
    console.log("wrap the layot with useHome provider");
  },
  agree: false,
  setAgree: () => {
    console.log("wrap the layot with useHome provider");
  },
  dataToUpdate: null,
  setDataToUpdate: () => {
    console.log("wrap the layot with useHome provider");
  },
  itemToDelete: "",
  setItemToDelete: () => {
    console.log("wrap the layot with useHome provider");
  },
  addName: "",
  setAddName: () => {
    console.log("wrap the layot with useHome provider");
  },
  addAmount: "",
  setAddAmount: () => {
    console.log("wrap the layot with useHome provider");
  },
  bottomSheetModalRef: { current: null },
  handleAdd: () => {
    console.log("wrap the layot with useHome provider");
  },
  inputRefs: { current: [] },
});

const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [netIncome, setNetIncome] = useState<string>("0");
  const [totalGrossIncome, setTotalGrossIncome] = useState<string>("0");
  const [expList, setExpList] = useState<list[]>([]);
  const [incList, setIncList] = useState<list[]>([]);
  const [perfer, setPerfer] = useState<string>("");
  const [allinputs, setAllInputs] = useState<input[]>([]);
  const [addName, setAddName] = useState<string>("");
  const [addAmount, setAddAmount] = useState<string>("");
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [agree, setAgree] = useState<boolean>(false);
  const [dataToUpdate, setDataToUpdate] = useState<ReportData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string>("");

  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const loadPreferences = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const rawData: any[] = storedData ? JSON.parse(storedData) : [];
      const normalized: input[] = rawData.map((item) => ({
        name: item.name,
        category: item.category || item.toggle || "other",
        value: typeof item.value === "number" ? item.value : 0,
      }));
      setAllInputs(normalized);
    } catch (error) {
      console.error("Error loading preferences:", error);
      ToastAndroid.show("Error loading preferences", ToastAndroid.SHORT);
    }
  }, []);

  const handleDelete = useCallback(
    async (name: string) => {
      try {
        const storedData = await AsyncStorage.getItem("perfer");
        let existingData: input[] = storedData ? JSON.parse(storedData) : [];

        const updatedData = existingData.filter((item) => item.name !== name);

        // Only update if the data actually changed
        if (updatedData.length !== existingData.length) {
          await AsyncStorage.setItem("perfer", JSON.stringify(updatedData));
          loadPreferences(); // Reload preferences
          ToastAndroid.show(`'${name}' deleted`, ToastAndroid.SHORT);
        } else {
          ToastAndroid.show(`'${name}' not found`, ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error("Error deleting preference:", error);
        ToastAndroid.show("Error deleting preference", ToastAndroid.SHORT);
      }
    },
    [loadPreferences],
  );

  const handleSheetClose = React.useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  const handleAdd = useCallback(async () => {
    const trimmedName = addName.trim();
    const trimmedAmount = addAmount.trim();

    if (trimmedName === "") {
      ToastAndroid.show("Please enter Expense Name", ToastAndroid.SHORT);
      return;
    }

    const amountNumber = trimmedAmount === "" ? 0 : parseInt(trimmedAmount, 10);
    if (Number.isNaN(amountNumber) || amountNumber < 0) {
      ToastAndroid.show("Enter a valid amount", ToastAndroid.SHORT);
      return;
    }

    // Default to 'other' category if not selected
    const selectedCategory = perfer === "" ? "other" : perfer;

    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const existingData: input[] = storedData ? JSON.parse(storedData) : [];

      // Check if name already exists
      if (
        existingData.some(
          (item) => item.name.toLowerCase() === trimmedName.toLowerCase(),
        )
      ) {
        ToastAndroid.show(
          `'${trimmedName}' already exists`,
          ToastAndroid.SHORT,
        );
        return;
      }

      const newData: input = {
        name: trimmedName,
        category: selectedCategory,
        value: amountNumber,
      };

      const updatedInputs = [...existingData, newData];
      await AsyncStorage.setItem("perfer", JSON.stringify(updatedInputs));

      // Update UI lists immediately
      setAllInputs(updatedInputs);

      // Reset modal state
      setAddName("");
      setAddAmount("");
      setPerfer("");
      handleSheetClose();
      ToastAndroid.show("Expense added successfully", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error saving preference:", error);
      ToastAndroid.show("Error saving preference", ToastAndroid.SHORT);
    }
  }, [addName, addAmount, perfer, setAllInputs, handleSheetClose]);

  React.useEffect(() => {
    loadPreferences();
  }, []);

  React.useEffect(() => {
    const initialExpList: list[] = [];

    allinputs.forEach((input) => {
      initialExpList.push({
        name: input.name,
        value: input.value ?? 0,
        category: input.category || "other",
      });
    });

    setExpList(initialExpList);
  }, [allinputs]);

  React.useEffect(() => {
    const performOperation = async () => {
      if (!agree) return;

      if (showWarning === "save" && dataToUpdate) {
        const month = dataToUpdate.month;
        try {
          const storedData = await AsyncStorage.getItem(month);
          const existingData: ReportData[] = storedData
            ? JSON.parse(storedData)
            : [];

          const existingEntryIndex = existingData.findIndex(
            (item) => item.todaysDate === dataToUpdate.todaysDate,
          );

          if (existingEntryIndex !== -1) {
            existingData[existingEntryIndex] = dataToUpdate;
            await AsyncStorage.setItem(month, JSON.stringify(existingData));
            ToastAndroid.show("Data updated successfully", ToastAndroid.LONG);
          } else {
            existingData.push(dataToUpdate);
            await AsyncStorage.setItem(month, JSON.stringify(existingData));
            ToastAndroid.show("Data inserted", ToastAndroid.LONG);
          }
        } catch (error) {
          console.error("Error updating data:", error);
          ToastAndroid.show("Error updating data", ToastAndroid.SHORT);
        } finally {
          setDataToUpdate(null);
          setAgree(false);
          setShowWarning(null);
        }
      } else if (showWarning === "delete" && itemToDelete) {
        await handleDelete(itemToDelete);
        setAgree(false);
        setShowWarning(null);
        setItemToDelete("");
      }
    };

    performOperation();
  }, [agree, dataToUpdate, showWarning, itemToDelete]);

  const contextValue = useMemo(
    () => ({
      inputRefs,
      handleAdd,
      bottomSheetModalRef,
      itemToDelete,
      dataToUpdate,
      agree,
      setAddName,
      addName,
      addAmount,
      setAddAmount,
      allinputs,
      perfer,
      incList,
      expList,
      totalGrossIncome,
      netIncome,
      setAgree,
      setAddAmount,
      setAllInputs,
      setDataToUpdate,
      setExpList,
      setIncList,
      setItemToDelete,
      setNetIncome,
      setPerfer,
      setShowWarning,
      setTotalGrossIncome,
      showWarning,
    }),
    [
      inputRefs,
      handleAdd,
      itemToDelete,
      dataToUpdate,
      agree,
      addName,
      addAmount,
      allinputs,
      perfer,
      incList,
      expList,
      totalGrossIncome,
      netIncome,
      showWarning,
    ],
  );

  return (
    <HomeContext.Provider value={contextValue}>{children}</HomeContext.Provider>
  );
};

export { HomeContext, HomeProvider };
