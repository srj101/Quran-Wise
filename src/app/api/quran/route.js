export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const surah = searchParams.get("surah"); // Get the surah from the query params

  if (!surah) {
    return new Response(
      JSON.stringify({ error: "Missing 'surah' parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const surahdetails = `https://quranapi.pages.dev/api/${surah}.json`;
    const surahData = await fetch(surahdetails).then((res) => res.json());

    const versesaudios = surahData.english.map((verse, i) => {
      const audio = `https://quranaudio.pages.dev/2/${surah}_${i + 1}.mp3`;

      return audio;
    });

    const data = {
      surah: surahData.surahName,
      bismillahaudio: `https://quranaudio.pages.dev/2/1_1.mp3`,
      verses: {
        arabic: surahData.arabic1,
        translation: surahData.english,
        audio: versesaudios,
      },
      surahNameArabic: surahData.surahNameArabic,
      totalAyah: surahData.totalAyah,
      revelationPlace: surahData.revelationPlace,
      surahNameArabicLong: surahData.surahNameArabicLong,
      surahNo: surahData.surahNo,
      surahNameTranslation: surahData.surahNameTranslation,
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "An error occurred", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
