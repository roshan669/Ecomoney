import { input, list } from "@/types/types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { ToastAndroid, Appearance } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { Colors } from "@/constants/theme";

interface HomeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  themeColors: typeof Colors.light;
  expList: list[];
  setExpList: (value: list[]) => void;
  perfer: string;
  setPerfer: (value: string) => void;
  allinputs: input[];
  setAllInputs: (value: input[]) => void;
  showWarning: string | null;
  setShowWarning: (value: string | null) => void;
  agree: boolean;
  setAgree: (value: boolean) => void;
  itemToDelete: string;
  setItemToDelete: (value: string) => void;
  setAddName: (value: string) => void;
  addName: string;
  addAmount: string;
  setAddAmount: (value: string) => void;
  bottomSheetModalRef: React.Ref<any>;
  handleAdd: () => void;
  inputRefs: React.RefObject<(TextInput | null)[]>;
  currencySymbol: string;
  setCurrencySymbol: (value: string) => void;
  dbVersion: number;
  incrementDbVersion: () => void;
}

const HomeContext = createContext<HomeContextType>({
  theme: "light",
  toggleTheme: () => {
    console.log("wrap the layot with useHome provider");
  },
  themeColors: Colors.light,
  expList: [],
  setExpList: () => {
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
  currencySymbol: "$",
  setCurrencySymbol: () => {
    console.log("wrap the layot with useHome provider");
  },
  dbVersion: 0,
  incrementDbVersion: () => {
    console.log("wrap the layot with useHome provider");
  },
});

const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<"light" | "dark">(
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );
  const [expList, setExpList] = useState<list[]>([]);
  const [perfer, setPerfer] = useState<string>("");
  const [allinputs, setAllInputs] = useState<input[]>([]);
  const [addName, setAddName] = useState<string>("");
  const [addAmount, setAddAmount] = useState<string>("");
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [agree, setAgree] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string>("");
  const [currencySymbol, setCurrencySymbolState] = useState<string>("$");
  const [dbVersion, setDbVersion] = useState<number>(0);

  const incrementDbVersion = useCallback(() => {
    setDbVersion(prev => prev + 1);
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem("userTheme", newTheme);
  }, [theme]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("userTheme");
        if (storedTheme === "light" || storedTheme === "dark") {
          setTheme(storedTheme);
        }
      } catch (e) {
        console.error("Failed to load theme preference", e);
      }
    };
    loadTheme();
  }, []);

  const setCurrencySymbol = useCallback(async (symbol: string) => {
    setCurrencySymbolState(symbol);
    await AsyncStorage.setItem("currencySymbol", symbol);
  }, []);

  const loadCurrency = useCallback(async () => {
    try {
      const storedSymbol = await AsyncStorage.getItem("currencySymbol");
      if (storedSymbol) {
        setCurrencySymbolState(storedSymbol);
      } else {
        // Default
        setCurrencySymbolState("$");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    loadCurrency();
  }, [loadCurrency]);

  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const loadPreferences = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const rawData: any[] = storedData ? JSON.parse(storedData) : [];
      const normalized: input[] = rawData.map((item) => ({
        id: item.id,
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
    async (identifier: string) => {
      try {
        const storedData = await AsyncStorage.getItem("perfer");
        const existingData: input[] = storedData ? JSON.parse(storedData) : [];

        // Try deleting by ID first
        let updatedData = existingData.filter((item) => item.id !== identifier);

        // If nothing changed, try deleting by name (legacy support)
        if (updatedData.length === existingData.length) {
          updatedData = existingData.filter((item) => item.name !== identifier);
        }

        // Only update if the data actually changed
        if (updatedData.length !== existingData.length) {
          await AsyncStorage.setItem("perfer", JSON.stringify(updatedData));
          loadPreferences(); // Reload preferences
          ToastAndroid.showWithGravity(
            `Deleted`,
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        } else {
          ToastAndroid.show(`Item not found`, ToastAndroid.SHORT);
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

      const newData: input = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
  }, [loadPreferences]);

  React.useEffect(() => {
    const initialExpList: list[] = [];

    allinputs.forEach((input) => {
      initialExpList.push({
        id: input.id,
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

      if (showWarning === "delete" && itemToDelete) {
        await handleDelete(itemToDelete);
        setAgree(false);
        setShowWarning(null);
        setItemToDelete("");
      }
    };

    performOperation();
  }, [agree, showWarning, itemToDelete, handleDelete]);

  const contextValue = useMemo(
    () => ({
      inputRefs,
      handleAdd,
      bottomSheetModalRef,
      itemToDelete,
      agree,
      setAddName,
      addName,
      addAmount,
      setAddAmount,
      allinputs,
      perfer,
      expList,
      setAgree,
      setAllInputs,
      setExpList,
      setItemToDelete,
      setPerfer,
      setShowWarning,
      showWarning,
      currencySymbol,
      setCurrencySymbol,
      theme,
      toggleTheme,
      themeColors: Colors[theme],
      dbVersion,
      incrementDbVersion,
    }),
    [
      inputRefs,
      handleAdd,
      itemToDelete,
      agree,
      addName,
      addAmount,
      allinputs,
      perfer,
      expList,
      showWarning,
      currencySymbol,
      setCurrencySymbol,
      theme,
      toggleTheme,
      dbVersion,
      incrementDbVersion,
    ],
  );

  return (
    <HomeContext.Provider value={contextValue}>{children}</HomeContext.Provider>
  );
};

export { HomeContext, HomeProvider };
