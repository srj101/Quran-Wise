const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query"); // Get the surah from the query params

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Missing 'query' parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Using the Quran as a source, answer the following question concisely and accurately. Provide the surah name, ayah number(s), and a brief explanation to support the answer. If possible, include English and Bengali translations alongside the original Arabic text. Question: ${query}`;
    const result = await model.generateContent(prompt);
    console.log(result.response.text());

    const data = {
      query: query,
      response: result.response.text(),
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
