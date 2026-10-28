// Multi-source resilient Quran Verse Fetcher with client-side in-memory caching
// Fetches Arabic Uthmani text, English translation (Sahih International), and Bengali translation (Muhiuddin Khan).

const surahCache = new Map();

/**
 * Fetch verses (Arabic, English, Bengali) for a surah.
 */
export async function getSurahVerses(surahId) {
  const id = Number(surahId);
  if (surahCache.has(id)) {
    return surahCache.get(id);
  }

  // Attempt 1: alquran.cloud triple edition (Arabic Uthmani + English Sahih + Bengali Muhiuddin Khan)
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,en.sahih,bn.bengali`
    );
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && json.data && json.data.length >= 2) {
        const arabicData = json.data[0];
        const englishData = json.data[1];
        const bengaliData = json.data[2] || { ayahs: [] };

        const result = {
          surahId: id,
          surahName: arabicData.englishName || `Surah ${id}`,
          surahArabic: arabicData.name || "",
          verses: arabicData.ayahs.map((ayah, index) => ({
            ayahNumber: ayah.numberInSurah,
            arabic: cleanArabicText(ayah.text),
            english: cleanTranslationText(englishData.ayahs[index]?.text || ""),
            bengali: cleanTranslationText(bengaliData.ayahs[index]?.text || ""),
          })),
        };
        surahCache.set(id, result);
        return result;
      }
    }
  } catch (err) {
    console.warn(`Triple edition fetch failed for Surah ${id}, trying fallbacks...`, err);
  }

  // Attempt 2: quranapi.pages.dev + Bengali fallback
  try {
    const res = await fetch(`https://quranapi.pages.dev/api/${id}.json`);
    if (res.ok) {
      const data = await res.json();

      // Optionally fetch Bengali translation
      let bengaliVerses = [];
      try {
        const bnRes = await fetch(
          `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ben-muhiuddinkhan/${id}.json`
        );
        if (bnRes.ok) {
          const bnData = await bnRes.json();
          bengaliVerses = bnData.verses || [];
        }
      } catch (_) {}

      const result = {
        surahId: id,
        surahName: data.surahName || `Surah ${id}`,
        surahArabic: data.surahNameArabic || "",
        verses: data.arabic1.map((arabicText, index) => ({
          ayahNumber: index + 1,
          arabic: cleanArabicText(arabicText),
          english: cleanTranslationText((data.english && data.english[index]) || ""),
          bengali: cleanTranslationText(bengaliVerses[index]?.text || ""),
        })),
      };
      surahCache.set(id, result);
      return result;
    }
  } catch (err) {
    console.warn(`quranapi.pages.dev failed for Surah ${id}...`, err);
  }

  // Attempt 3: Internal API route
  try {
    const res = await fetch(`/api/quran?surah=${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.verses && data.verses.arabic && data.verses.translation) {
        const result = {
          surahId: id,
          surahName: data.surah || `Surah ${id}`,
          surahArabic: data.surahNameArabic || "",
          verses: data.verses.arabic.map((arabicText, index) => ({
            ayahNumber: index + 1,
            arabic: cleanArabicText(arabicText),
            english: cleanTranslationText(data.verses.translation[index] || ""),
            bengali: "",
          })),
        };
        surahCache.set(id, result);
        return result;
      }
    }
  } catch (err) {
    console.error(`Internal route failed for Surah ${id}:`, err);
  }

  throw new Error(`Failed to load verses for Surah ${id} from all sources.`);
}

/**
 * Remove ayah numbers, end symbols, and brackets from Arabic text.
 * Leaves only raw Arabic recitation text.
 */
export function cleanArabicText(text) {
  if (!text) return "";
  return text
    // Remove Arabic end of ayah ornament and following numbers: ۝ and ﴿ ﴾
    .replace(/[\u06DD\uFD3E\uFD3F]/g, "")
    // Remove numbers inside parentheses e.g. (117) or (١١٧)
    .replace(/\([0-9٠-٩]+\)/g, "")
    // Remove brackets with numbers e.g. [117]
    .replace(/\[[0-9٠-٩]+\]/g, "")
    // Remove standalone numbers at the very end of line
    .replace(/[0-9٠-٩]+$/g, "")
    // Remove bismillah prefix if it is duplicated or special Unicode marks
    .replace(/^\uFEFF/, "")
    .trim();
}

/**
 * Remove metadata prefixes like [Al-Fatihah 1:1] or (1) from translation text.
 * Leaves only the raw translation text.
 */
export function cleanTranslationText(text) {
  if (!text) return "";
  return text
    // Remove [SurahName X:Y] or [X:Y]
    .replace(/^\[[^\]]+\]\s*/g, "")
    // Remove leading verse numbers like "1. " or "1 - "
    .replace(/^[0-9]+[\.\-\:]\s*/g, "")
    // Remove trailing verse numbers e.g. (1)
    .replace(/\s*\([0-9]+\)\s*$/g, "")
    .trim();
}
