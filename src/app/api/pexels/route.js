import axios from "axios";

const pexelsApiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;

export async function GET(request) {
  const urlParams = new URL(request.url).searchParams;
  const query = urlParams.get("query"); // Extract the query parameter

  if (!query) {
    return new Response("Query parameter is required", { status: 400 });
  }

  const url = `https://api.pexels.com/v1/search?query=${query}&per_page=1`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: pexelsApiKey,
      },
    });

    if (response.data.photos.length > 0) {
      return new Response(
        JSON.stringify({ imageUrl: response.data.photos[0].src.original }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error(
      "Error fetching image from Pexels:",
      error.response ? error.response.data : error.message
    );
    return new Response(
      JSON.stringify({
        error: "Failed to fetch image",
        details: error.response ? error.response.data : error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
