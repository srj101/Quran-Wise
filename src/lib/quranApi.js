// Multi-source resilient Quran Verse Fetcher with client-side in-memory caching
const surahCache = new Map();

/**
 * Fetch verses (Arabic text and English translation) for a surah.
 * Supports fallback endpoints and client-side caching.
 */
export async function getSurahVerses(surahId) {
  const id = Number(surahId);
  if (surahCache.has(id)) {
    return surahCache.get(id);
  }

  // Attempt 1: Internal API route
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
            arabic: arabicText,
            english: data.verses.translation[index] || "",
          })),
        };
        surahCache.set(id, result);
        return result;
      }
    }
  } catch (err) {
    console.warn(`Internal API fetch failed for Surah ${id}, trying CDN directly...`, err);
  }

  // Attempt 2: Directly from quranapi.pages.dev
  try {
    const res = await fetch(`https://quranapi.pages.dev/api/${id}.json`);
    if (res.ok) {
      const data = await res.json();
      const result = {
        surahId: id,
        surahName: data.surahName || `Surah ${id}`,
        surahArabic: data.surahNameArabic || "",
        verses: data.arabic1.map((arabicText, index) => ({
          ayahNumber: index + 1,
          arabic: arabicText,
          english: (data.english && data.english[index]) || "",
        })),
      };
      surahCache.set(id, result);
      return result;
    }
  } catch (err) {
    console.warn(`quranapi.pages.dev failed for Surah ${id}, trying alquran.cloud...`, err);
  }

  // Attempt 3: alquran.cloud dual edition (Uthmani + Sahih International)
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,en.sahih`
    );
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && json.data && json.data.length >= 2) {
        const arabicData = json.data[0];
        const englishData = json.data[1];
        const result = {
          surahId: id,
          surahName: arabicData.englishName || `Surah ${id}`,
          surahArabic: arabicData.name || "",
          verses: arabicData.ayahs.map((ayah, index) => ({
            ayahNumber: ayah.numberInSurah,
            arabic: ayah.text,
            english: englishData.ayahs[index]?.text || "",
          })),
        };
        surahCache.set(id, result);
        return result;
      }
    }
  } catch (err) {
    console.error(`All endpoints failed for Surah ${id}:`, err);
  }

  throw new Error(`Failed to load verses for Surah ${id} from all sources.`);
}
