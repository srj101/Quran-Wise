// API Route to fetch and cache official ayah timings from MP3Quran API v3
const timingCache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const surah = searchParams.get("surah");
  const read = searchParams.get("read") || "123"; // Default: Mishary Alafasy (id: 123)

  if (!surah) {
    return new Response(JSON.stringify({ error: "Missing 'surah' parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cacheKey = `${read}_${surah}`;
  if (timingCache.has(cacheKey)) {
    return new Response(JSON.stringify(timingCache.get(cacheKey)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  }

  try {
    const url = `https://www.mp3quran.net/api/v3/ayat_timing?surah=${surah}&read=${read}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MP3Quran timing responded with status ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No timing data returned from MP3Quran");
    }

    const timings = data.map((item) => ({
      ayah: item.ayah,
      startTimeMs: item.start_time,
      endTimeMs: item.end_time,
      startSec: item.start_time / 1000,
      endSec: item.end_time / 1000,
      durationSec: (item.end_time - item.start_time) / 1000,
    }));

    timingCache.set(cacheKey, timings);

    return new Response(JSON.stringify(timings), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (err) {
    console.error(`Timing fetch error for Surah ${surah}, read ${read}:`, err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch timing data", details: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
