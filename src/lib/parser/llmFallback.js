// src/lib/parser/llmFallback.js — Gemini pre-check

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Checks if an image file contains a university class schedule or registration form.
 * Sends the image to Gemini as base64 with a classification prompt.
 *
 * On any failure, returns { isValid: true } as a safe default
 * so the user isn't blocked.
 *
 * @param {File} file — an image file (PNG/JPEG)
 * @returns {Promise<{ isValid: boolean, reason?: string }>}
 */
export async function preCheckIsRegistrationForm(file) {
  const key = process.env.NEXT_PUBLIC_GEMINI_KEY;
  if (!key) return { isValid: true };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const response = await fetch(`${API_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        },
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64,
                },
              },
              {
                text: 'You are a document classifier. Look at this image and determine if it is a university class schedule, course registration form, or academic enrollment document.\n\nA valid document typically contains: a table with course codes, subject names, days of the week, time slots, and room assignments.\n\nReply with only this JSON object and nothing else:\n{"isValid": true, "reason": "one sentence"}\nor\n{"isValid": false, "reason": "one sentence explaining what the image actually is"}\n\nDo not include markdown, code fences, or any other text.',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return JSON.parse(rawText.trim());
  } catch {
    // Safe default — let the user proceed
    return { isValid: true };
  }
}
