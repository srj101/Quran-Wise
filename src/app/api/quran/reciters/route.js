// API route to return verified MP3Quran reciters with full 114 Surah timing data
import { MP3QURAN_RECITERS } from "@/data/reciters";

export async function GET() {
  return new Response(JSON.stringify(MP3QURAN_RECITERS), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
