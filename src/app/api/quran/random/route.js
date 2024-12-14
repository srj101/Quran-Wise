export async function GET(request) {
  try {
    const randomNum = Math.floor(Math.random() * 6236) + 1;

    // Fetching API
    const arabicApi = `https://api.alquran.cloud/v1/ayah/${randomNum}/ar.alafasy`;
    const banglaApi = `https://api.alquran.cloud/v1/ayah/${randomNum}/bn.bengali`;
    const englishApi = `https://api.alquran.cloud/v1/ayah/${randomNum}/en.asad`;

    const arabicRes = await fetch(arabicApi);
    const banglaRes = await fetch(banglaApi);
    const englishRes = await fetch(englishApi);

    if (!arabicRes.ok || !banglaRes.ok || !englishRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch verse" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arabicData = await arabicRes.json();
    const banglaData = await banglaRes.json();
    const englishData = await englishRes.json();

    const data = {
      english: englishData.data.text,
      arabic: arabicData.data.text,
      bangla: banglaData.data.text,
      audio: arabicData.data.audio,
      surahName: arabicData.data.englishName,
      ayahNumber: arabicData.data.numberInSurah,
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
