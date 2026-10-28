import { notFound } from "next/navigation";
import Sidebar from "@/components/SurahDetails/Sidebar";
import MainContent from "@/components/SurahDetails/MainContent";
import axios from "axios";
import { SURAHS_LIST } from "@/data/surahList";

export default async function SurahPage({ params }) {
  const { surah } = await params;

  if (!surah) {
    console.error("Surah parameter is missing!");
    notFound();
  }

  const fetchSurahData = async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/quran?surah=${surah}`);

      if (!response.ok) {
        throw new Error(`API fetch failed: ${response.status}`);
      }

      const verses = await response.json();

      return verses;
    } catch (error) {
      console.error("Fetch Error:", error.message);
      throw error;
    }
  };

  const getChapters = async () => {
    try {
      const url = "https://quranapi.pages.dev/api/surah.json";
      const response = await axios.get(url, { timeout: 3000 });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (error) {
      console.warn("External surah list fetch failed, using fallback.");
    }
    return SURAHS_LIST.map((s) => ({
      surahNameArabic: s.arabic,
      surahNameArabicLong: s.arabic,
      surahName: s.name,
      surahNameTranslation: s.english,
      totalAyah: s.verses,
      revelationPlace: s.revelation,
    }));
  };

  const chapters = await getChapters();
  const verses = await fetchSurahData().catch((err) => {
    console.error("Error loading Surah data:", err.message);
    notFound();
  });

  return (
    <div className="flex">
      {/* Sidebar (Visible on large screens) */}

      <Sidebar verses={verses} chapters={chapters} />

      {/* Main Content */}
      <div className="w-full px-4 mx-auto flex justify-center">
        <MainContent verses={verses} />
      </div>
    </div>
  );
}
