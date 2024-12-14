"use client";

import { useState, useEffect } from "react";

const Hero = () => {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const NEXT_PUBLIC_BASE_URL =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const response = await fetch(
          `${NEXT_PUBLIC_BASE_URL}/api/quran/random/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch verse");
        }

        const data = await response.json();

        setVerse(data.data); // Save the fetched data to the state
      } catch (error) {
        setError(error.message); // Handle any errors
      } finally {
        setLoading(false); // Stop loading once the fetch is complete
      }
    };

    fetchVerse(); // Call fetchVerse on component mount
  }, []); // Empty dependency array to run the effect only once (on mount)

  return (
    <section
      className="relative w-full bg-cover bg-center h-[80vh] flex items-center justify-center text-center text-background"
      style={{
        backgroundImage:
          "url('https://unsplash.com/photos/dri5ZiEWQWw/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8bW91c3F1ZXxlbnwwfHx8fDE3MzQwMzQ3NzR8MA&force=true&w=2400')",
      }}
    >
      <div className="bg-black flex items-center flex-col bg-opacity-60 p-8 rounded-lg max-w-6xl w-full text-white">
        {loading || error || verse ? (
          <>
            {error && <p className="text-lg text-red-500">Error: {error}</p>}
            {!error && !verse && (
              <p className="text-lg">Loading a beautiful verse for you...</p>
            )}
            {verse && (
              <>
                <p className="text-lg mb-4">
                  <strong></strong> <span>{verse.arabic}</span>
                </p>
                <h3 className="text-xl font-bold mb-4">“{verse.english}”</h3>
                <p className="text-md mb-4">
                  <strong></strong> <span>{verse.bangla}</span>
                </p>
                <p className="text-sm mb-6">
                  Surah {verse.surah} - Ayah {verse.ayahNumber}
                </p>
                <div className="mb-6 flex justify-center">
                  <audio controls>
                    <source src={verse.audio} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <a
                  href="/quran"
                  className="bg-accent text-background px-6 py-3 rounded-lg hover:bg-secondary transition"
                >
                  Explore the Quran
                </a>
              </>
            )}
          </>
        ) : (
          <p className="text-lg">Loading a beautiful verse for you...</p>
        )}
      </div>
    </section>
  );
};

export default Hero;
