import { loadTensorflowModel } from "react-native-fast-tflite";

// ==========================================
// 1. LOAD MODEL CONFIG, LABELS & WORD INDEX
// ==========================================

const MODEL_CONFIG = require("../assets/model/model_config.json") as {
    max_len: number;
    max_words: number;
    num_classes: number;
    oov_token: string;
    labels: Record<string, string>;
};

const WORD_INDEX = require("../assets/model/word_index.json") as Record<string, number>;

const MAX_LEN = MODEL_CONFIG.max_len; // 20
const OOV_INDEX = WORD_INDEX[MODEL_CONFIG.oov_token] || 1; // <OOV> → 1

// Build ordered labels array from the config
const LABELS: string[] = [];
for (let i = 0; i < MODEL_CONFIG.num_classes; i++) {
    LABELS.push(MODEL_CONFIG.labels[String(i)] || `Unknown_${i}`);
}

// Map model labels → UI categories
const LABEL_MAPPING: Record<string, string> = {
    "Food & Drink": "Food",
    "Groceries": "Bills",
    "Bills & Utilities": "Bills",
    "Services": "Other",
    "Travel": "Transport",
};

// ==========================================
// 2. SEQUENCE TOKENIZER (matches Python's Tokenizer + pad_sequences)
// ==========================================

const tokenize = (text: string): Float32Array => {
    // 1. Clean text — same as Python training pipeline
    const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean);

    // 2. Convert words → indices (OOV for unknown words, 0 for padding)
    const sequence: number[] = [];
    for (const word of words) {
        const idx = WORD_INDEX[word];
        sequence.push(idx !== undefined ? idx : OOV_INDEX);
    }

    // 3. Post-pad / truncate to MAX_LEN (matches padding="post", truncating="post")
    const padded = new Float32Array(MAX_LEN); // initialized to 0
    const len = Math.min(sequence.length, MAX_LEN);
    for (let i = 0; i < len; i++) {
        padded[i] = sequence[i];
    }

    console.log("Tokenize:", {
        input: text,
        words,
        sequence: sequence.slice(0, MAX_LEN),
        oovCount: sequence.filter((v) => v === OOV_INDEX).length,
    });

    return padded;
};

// ==========================================
// 3. MODEL LOADING & PREDICTION
// ==========================================

let model: any = null;

export const loadModel = async () => {
    if (model) return;
    try {
        model = await loadTensorflowModel(
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require("../assets/model/expense_classifier.tflite"),
        );
        if (model?.inputs?.length) {
            console.log("TFLite inputs:", model.inputs);
        }
        if (model?.outputs?.length) {
            console.log("TFLite outputs:", model.outputs);
        }
        console.log(
            `✅ Model loaded! Labels: ${LABELS.length}, Vocab: ${Object.keys(WORD_INDEX).length}, MaxLen: ${MAX_LEN}`,
        );
    } catch (e) {
        console.error("❌ Failed to load model:", e);
    }
};

export const predictCategory = async (text: string) => {
    if (!model) await loadModel();

    // 1. Tokenize input (sequence-based, matching Python pad_sequences)
    const inputTensor = tokenize(text);

    // 2. Run model
    const output = model.runSync([inputTensor]);

    // 3. Parse output probabilities
    const scores = Array.from(output[0] as Float32Array);

    if (scores.length !== LABELS.length) {
        console.warn("Label/output size mismatch:", {
            labels: LABELS.length,
            outputs: scores.length,
        });
        return {
            category: "Uncategorized",
            confidence: Math.max(...scores),
        };
    }

    // 4. Find best prediction
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

    // 5. Confidence check
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