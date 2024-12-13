import Link from "next/link";
import axios from "axios";

export default async function QuranPage() {
  const getChapters = async () => {
    try {
      const url = "https://quranapi.pages.dev/api/surah.json";
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Request failed", error);
    }
  };

  const chapters = await getChapters();

  return (
    <section className="bg-background min-h-screen py-8 px-4">
      <h1 className="text-3xl font-bold text-primary text-center mb-8">
        Surah List
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter, i) => (
          <Link
            href={`/quran/${i + 1}`}
            key={i}
            className="block bg-primary text-background rounded-lg p-4 hover:bg-secondary transition"
          >
            <h2 className="text-xl font-bold mb-2">
              {i}. {chapter.surahNameArabic}
            </h2>
            <p className="text-lg">
              {chapter.surahNameArabicLong}: {chapter.surahName}
            </p>
            <p className="text-accent italic">{chapter.surahNameTranslation}</p>
            <p className="text-sm mt-1">Total Ayahs: {chapter.totalAyah}</p>
            <p className="text-sm">Revealed: {chapter.revelationPlace}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
