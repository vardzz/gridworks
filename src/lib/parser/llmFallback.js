// src/lib/parser/llmFallback.js — Gemini pre-check + Gemini extraction (PRD §9.2)

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Checks if an image file contains a university class schedule.
 * Sends the image to Gemini as base64 with a yes/no prompt.
 *
 * On any failure, returns { isSchedule: true } as a safe default
 * so the user isn't blocked.
 *
 * @param {File} file — an image file (PNG/JPEG)
 * @returns {Promise<{ isSchedule: boolean }>}
 */
export async function preCheckIsSchedule(file) {
  const key = process.env.NEXT_PUBLIC_GEMINI_KEY;
  if (!key) return { isSchedule: true };

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
                text: 'Does this image contain a university class schedule or course registration form? Reply with ONLY one of these two JSON objects, nothing else: {"isSchedule": true} or {"isSchedule": false}',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Strip markdown fences if Gemini wraps the response
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Safe default — let the user proceed
    return { isSchedule: true };
  }
}

/**
 * Sends raw extracted text to Gemini for structured schedule extraction.
 * Returns a parsed array of schedule entry objects.
 *
 * Throws on API error or JSON parse failure so the orchestrator can
 * fall back to regex results.
 *
 * @param {string} rawText — raw text extracted from PDF or OCR
 * @returns {Promise<Array<Object>>}
 */
export async function extractWithLLM(rawText) {
  const key = process.env.NEXT_PUBLIC_GEMINI_KEY;
  if (!key) throw new Error("No Gemini API key configured");

  const prompt = `You are a university schedule parser. Extract all class schedule entries from the text below.
Return ONLY a valid JSON array of objects. Each object must have these exact keys:
subject_code, subject_title, professor, room, days (array of full day names like "Monday"), start_time (HH:MM 24-hour format, e.g. "13:30"), end_time (HH:MM 24-hour format, e.g. "15:00").
If a field cannot be determined, use null. Do not include any explanation or markdown fencing.

CRITICAL INSTRUCTIONS:
1. ONLY extract actual classes/courses from the schedule table. Do NOT extract miscellaneous text like student info, fees, terms, remarks, or registration instructions.
2. If a course has multiple schedules/slots (e.g. Wed 4:00pm-7:00pm and Fri 2:30pm-4:30pm), you MUST split them into separate objects in the array.
3. Normalize days to their full names (e.g., "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday").
4. Normalize times to 24-hour HH:MM format (e.g. "04:00 PM" -> "16:00").
5. The subject_title often wraps across multiple lines in the raw text (e.g., "Physical Activities Toward Health and" on one line and "Fitness 1" on the next). You MUST stitch these back together to capture the full 100% accurate course name.

TEXT:
${rawText}`;

  const response = await fetch(`${API_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  // Strip markdown fences if present
  const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  return JSON.parse(cleaned); // Throws if response isn't valid JSON
}
