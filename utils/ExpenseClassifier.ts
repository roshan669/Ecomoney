import { loadTensorflowModel, type Tensor } from "react-native-fast-tflite";

// ==========================================
// 1. LOAD VOCAB/LABELS FROM ASSETS
// ==========================================

const LABELS = require("../assets/labels.json") as string[];
const VOCAB = require("../assets/vocab.json") as string[];

// Map model labels to UI categories
const LABEL_MAPPING: Record<string, string> = {
    "Food & Drink": "Food",
    "Groceries": "Bills",
    "Bills & Utilities": "Bills",
    "Services": "Other",
    "Travel": "Transport",
};

const VOCAB_INDEX: Record<string, number> = Object.create(null);
VOCAB.forEach((word, index) => {
    VOCAB_INDEX[word] = index;
});

const TOKEN_ALIASES: Record<string, string> = {
    phone: "mobile",
    phones: "mobile",
    cellphone: "mobile",
    cell: "mobile",
};

const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1,
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const getVocabIndex = (token: string): number => {
    const normalized = TOKEN_ALIASES[token] ?? token;
    const direct = VOCAB_INDEX[normalized];
    if (direct !== undefined) return direct;

    if (normalized.length > 3 && normalized.endsWith("ies")) {
        const alt = `${normalized.slice(0, -3)}y`;
        const idx = VOCAB_INDEX[alt];
        if (idx !== undefined) return idx;
    }

    if (normalized.length > 3 && normalized.endsWith("es")) {
        const alt = normalized.slice(0, -2);
        const idx = VOCAB_INDEX[alt];
        if (idx !== undefined) return idx;
    }

    if (normalized.length > 2 && normalized.endsWith("s")) {
        const alt = normalized.slice(0, -1);
        const idx = VOCAB_INDEX[alt];
        if (idx !== undefined) return idx;
    }

    // Fuzzy matching for misspellings
    if (normalized.length > 3) {
        let bestMatch = -1;
        let minDistance = 2;
        for (const vocabWord of VOCAB) {
            if (Math.abs(vocabWord.length - normalized.length) > 2) continue;
            const distance = levenshteinDistance(normalized, vocabWord);
            if (distance <= 1 && distance < minDistance) {
                minDistance = distance;
                bestMatch = VOCAB_INDEX[vocabWord];
            }
        }
        if (bestMatch !== -1) return bestMatch;
    }

    return -1;
};

// ==========================================
// 2. THE LOGIC
// ==========================================

let model: any = null;

const getInputLength = (shape?: number[]): number => {
    if (!shape || shape.length === 0) return 0;
    return shape.reduce((acc, dim) => acc * (dim > 0 ? dim : 1), 1);
};

const createInputBuffer = (tensor?: Tensor): Float32Array | Int32Array | Uint8Array | Int8Array | Int16Array => {
    const length = getInputLength(tensor?.shape) || VOCAB.length;
    switch (tensor?.dataType) {
        case "int32":
            return new Int32Array(length);
        case "uint8":
            return new Uint8Array(length);
        case "int8":
            return new Int8Array(length);
        case "int16":
            return new Int16Array(length);
        case "float32":
        case "float16":
        case "float64":
        default:
            return new Float32Array(length);
    }
};

// Load the model once
export const loadModel = async () => {
    if (model) return;
    try {
        model = await loadTensorflowModel(require("../assets/model.tflite"));
        if (model?.inputs?.length) {
            console.log("TFLite inputs:", model.inputs);
        }
        if (model?.outputs?.length) {
            console.log("TFLite outputs:", model.outputs);
        }
        console.log("✅ Model loaded successfully!");
    } catch (e) {
        console.error("❌ Failed to load model:", e);
    }
};

// Convert text to numbers (Tokenization)
const tokenize = (text: string, inputTensor?: Tensor) => {
    // 1. Clean text: Lowercase + remove punctuation
    const cleanText = text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const words = cleanText.trim().split(/\s+/).filter(Boolean);
    const tokens: string[] = [];
    for (let i = 0; i < words.length; i += 1) {
        tokens.push(words[i]);
        if (i + 1 < words.length) {
            tokens.push(`${words[i]} ${words[i + 1]}`);
        }
    }

    // 2. Map to numbers
    const input = createInputBuffer(inputTensor);
    input.fill(0);

    const maxSeqLen = input.length || VOCAB.length;
    let unknownCount = 0;

    tokens.forEach((word) => {
        const vocabIndex = getVocabIndex(word);

        // If word is found, use its index. 
        // If not found, use 1 (which is usually [UNK] in Keras).
        // 0 is reserved for padding.
        const value = vocabIndex > -1 ? vocabIndex : 1;
        if (value === 1) unknownCount += 1;
        if (value >= maxSeqLen) return;
        if (input instanceof Uint8Array) {
            input[value] = 1;
        } else {
            input[value] = 1;
        }
    });

    if (words.length > 0) {
        const nonZero = Array.from(input).filter((v) => v !== 0).length;
        console.log("Token stats:", {
            total: tokens.length,
            unknown: unknownCount,
            sample: words.slice(0, 6),
            inputType: input.constructor.name,
            nonZero,
            vocabSize: maxSeqLen,
        });
    }

    return input;
};

// The Main Function
export const predictCategory = async (text: string) => {
    if (!model) await loadModel();

    // 1. Prepare input
    const inputSpec = model?.inputs?.[0];
    const inputTensor = tokenize(text, inputSpec);

    // 2. Run Model
    // runSync is faster for small models. It returns an array of probabilities.
    const output = model.runSync([inputTensor]);

    // 3. Find the highest probability
    const scores = Array.from(output[0] as Float32Array); // Already softmax probabilities
    console.log("Raw scores:", scores);

    if (scores.length !== LABELS.length) {
        console.warn(
            "Label/output size mismatch:",
            { labels: LABELS.length, outputs: scores.length },
        );
        return {
            category: "Uncategorized",
            confidence: Math.max(...scores),
        };
    }

    let maxScore = -1;
    let maxIndex = 0;
    let secondScore = -1;
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] > maxScore) {
            secondScore = maxScore;
            maxScore = scores[i];
            maxIndex = i;
        } else if (scores[i] > secondScore) {
            secondScore = scores[i];
        }
    }

    const top3 = scores
        .map((p, i) => ({ label: LABELS[i], p }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 3);
    console.log("Prediction top3:", top3);

    // 4. Return the label
    const confidenceGap = maxScore - secondScore;
    if (maxScore < 0.4 || confidenceGap < 0.05) {
        return {
            category: "Other",
            confidence: maxScore,
        };
    }

    const predictedLabel = LABELS[maxIndex];
    const mappedCategory = LABEL_MAPPING[predictedLabel] || predictedLabel;

    return {
        category: mappedCategory,
        confidence: maxScore,
    };
};