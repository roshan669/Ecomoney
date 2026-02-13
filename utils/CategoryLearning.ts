import AsyncStorage from "@react-native-async-storage/async-storage";

const LEARNING_KEY = "category_corrections";

interface Correction {
  text: string;
  predictedCategory: string;
  correctedCategory: string;
  timestamp: number;
}

export const saveCategoryCorrection = async (
  text: string,
  predictedCategory: string,
  correctedCategory: string
) => {
  try {
    const stored = await AsyncStorage.getItem(LEARNING_KEY);
    const corrections: Correction[] = stored ? JSON.parse(stored) : [];
    
    corrections.push({
      text: text.toLowerCase().trim(),
      predictedCategory,
      correctedCategory,
      timestamp: Date.now(),
    });
    
    // Keep only last 500 corrections
    if (corrections.length > 500) {
      corrections.splice(0, corrections.length - 500);
    }
    
    await AsyncStorage.setItem(LEARNING_KEY, JSON.stringify(corrections));
  } catch (error) {
    console.error("Error saving correction:", error);
  }
};

export const getLearnedCategory = async (text: string): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem(LEARNING_KEY);
    if (!stored) return null;
    
    const corrections: Correction[] = JSON.parse(stored);
    const normalized = text.toLowerCase().trim();
    
    // Find exact match first
    const exactMatch = corrections
      .filter((c) => c.text === normalized)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (exactMatch) return exactMatch.correctedCategory;
    
    // Find partial match
    const partialMatch = corrections
      .filter((c) => normalized.includes(c.text) || c.text.includes(normalized))
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return partialMatch?.correctedCategory || null;
  } catch (error) {
    console.error("Error getting learned category:", error);
    return null;
  }
};
