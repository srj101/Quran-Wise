"use client";

import { useState } from "react";
import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function CoursesPage() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await axios.get(`${baseUrl}/api/chat`, {
        params: { query },
      });
      setResponse(res.data.response);
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-3xl w-full">
        <h1 className="text-2xl font-bold text-center text-primary mb-4">
          📖 Discuss Quran-Wise
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Ask your question about the Quran...Ex. What is the meaning of Surah Al-Fatihah? or What should I do if I feel lost in life?"
          ></textarea>
          <button
            type="submit"
            className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-secondary transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </form>

        {response && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-primary mb-2">
              ✨ Response:
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {response.split("\n").map((line, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-2">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
