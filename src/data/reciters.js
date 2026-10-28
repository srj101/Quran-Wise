export const RECITERS = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    arabic: "مشاري بن راشد العفاسي",
    quality: "128 kbps Studio",
    getUrl: (surah, ayah) => {
      const s = String(surah).padStart(3, "0");
      const a = String(ayah).padStart(3, "0");
      return [
        `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`,
        `https://quranaudio.pages.dev/2/${surah}_${ayah}.mp3`,
        `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getAyahIndex(surah, ayah)}.mp3`,
      ];
    },
  },
  {
    id: "abdulbasit",
    name: "Abdul Basit Abdul Samad (Murattal)",
    arabic: "عبد الباسط عبد الصمد",
    quality: "192 kbps Studio",
    getUrl: (surah, ayah) => {
      const s = String(surah).padStart(3, "0");
      const a = String(ayah).padStart(3, "0");
      return [
        `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${s}${a}.mp3`,
        `https://cdn.islamic.network/quran/audio/128/ar.abdulbasitmurattal/${getAyahIndex(surah, ayah)}.mp3`,
      ];
    },
  },
  {
    id: "husary",
    name: "Mahmoud Khalil Al-Husary",
    arabic: "محمود خليل الحصري",
    quality: "128 kbps Classic",
    getUrl: (surah, ayah) => {
      const s = String(surah).padStart(3, "0");
      const a = String(ayah).padStart(3, "0");
      return [
        `https://everyayah.com/data/Husary_128kbps/${s}${a}.mp3`,
        `https://cdn.islamic.network/quran/audio/128/ar.husary/${getAyahIndex(surah, ayah)}.mp3`,
      ];
    },
  },
  {
    id: "minshawi",
    name: "Mohamed Siddiq Al-Minshawi (Murattal)",
    arabic: "محمد صديق المنشاوي",
    quality: "128 kbps Studio",
    getUrl: (surah, ayah) => {
      const s = String(surah).padStart(3, "0");
      const a = String(ayah).padStart(3, "0");
      return [
        `https://everyayah.com/data/Minshawy_Murattal_128kbps/${s}${a}.mp3`,
        `https://cdn.islamic.network/quran/audio/128/ar.minshawi/${getAyahIndex(surah, ayah)}.mp3`,
      ];
    },
  },
  {
    id: "sudais",
    name: "Abdur-Rahman As-Sudais",
    arabic: "عبد الرحمن السديس",
    quality: "192 kbps Makkah",
    getUrl: (surah, ayah) => {
      const s = String(surah).padStart(3, "0");
      const a = String(ayah).padStart(3, "0");
      return [
        `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${s}${a}.mp3`,
        `https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais/${getAyahIndex(surah, ayah)}.mp3`,
      ];
    },
  },
  {
    id: "shaatree",
    name: "Abu Bakr Ash-Shaatree",
    arabic: "أبو بكر الشاطري",
    quality: "128 kbps Clear",
    getUrl: (surah, ayah) => {
      const s = String(surah).padStart(3, "0");
      const a = String(ayah).padStart(3, "0");
      return [
        `https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/${s}${a}.mp3`,
        `https://cdn.islamic.network/quran/audio/128/ar.shaatree/${getAyahIndex(surah, ayah)}.mp3`,
      ];
    },
  },
];

// Helper to calculate 1-indexed cumulative ayah index across the Quran (1 to 6236)
// Cumulative verse counts before each surah (surah index 0 to 113)
const VERSE_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

export function getAyahIndex(surahId, ayahNumber) {
  let count = 0;
  for (let i = 0; i < surahId - 1; i++) {
    count += VERSE_COUNTS[i];
  }
  return count + ayahNumber;
}
