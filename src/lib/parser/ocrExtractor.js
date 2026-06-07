// src/lib/parser/ocrExtractor.js — Tesseract.js OCR (dynamically imported)

/**
 * Extracts text from an image file using Tesseract.js OCR.
 * Dynamically imports Tesseract so the ~10MB WASM bundle only loads when needed.
 *
 * @param {File} file — an image File object (PNG or JPEG)
 * @param {function} onProgress — callback receiving a number 0-100
 * @returns {Promise<string>} — the recognized text
 */
export async function extractTextFromImage(file, onProgress) {
  // Dynamic import — keeps initial bundle small
  const Tesseract = await import("tesseract.js");

  const objectUrl = URL.createObjectURL(file);

  try {
    const result = await Tesseract.recognize(objectUrl, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    return result.data.text;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
