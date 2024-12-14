// Import NextResponse from Next.js
import { NextResponse } from "next/server";

// Define the GET handler
export async function GET(request) {
  try {
    // Generate a random number between 1 and 6236 (total ayahs in Quran)
    const randomNum = Math.floor(Math.random() * 6236) + 1;

    // Define the API endpoints with the correct scheme
    const arabicApi = `https://api.alquran.cloud/v1/ayah/${randomNum}/ar.alafasy`;
    const banglaApi = `https://api.alquran.cloud/v1/ayah/${randomNum}/bn.bengali`;
    const englishApi = `https://api.alquran.cloud/v1/ayah/${randomNum}/en.asad`;

    // Fetch all APIs in parallel using Promise.all for efficiency
    const [arabicRes, banglaRes, englishRes] = await Promise.all([
      fetch(arabicApi),
      fetch(banglaApi),
      fetch(englishApi),
    ]);

    // Check if any of the fetch requests failed
    if (!arabicRes.ok || !banglaRes.ok || !englishRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch verse from one or more sources." },
        { status: 500 }
      );
    }

    // Parse all responses in parallel
    const [arabicData, banglaData, englishData] = await Promise.all([
      arabicRes.json(),
      banglaRes.json(),
      englishRes.json(),
    ]);

    // Construct the response data ensuring all fields are serializable
    const data = {
      english: englishData.data.text,
      arabic: arabicData.data.text,
      bangla: banglaData.data.text,
      audio: arabicData.data.audio, // Ensure this is a string URL
      surahName: arabicData.data.englishName, // Ensure this is a string
      ayahNumber: arabicData.data.numberInSurah, // Ensure this is a number
    };

    // Return the JSON response using NextResponse for better integration with Next.js
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Handle any unexpected errors gracefully
    return NextResponse.json(
      { error: "An unexpected error occurred.", details: error.message },
      { status: 500 }
    );
  }
}
