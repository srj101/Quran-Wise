"use client";

import { useEffect, useState } from "react";

const Hero = () => {
  const [verse, setVerse] = useState(null);

  useEffect(() => {
    // Fetch a random verse from AlQuran API
    fetch("https://api.alquran.cloud/v1/ayah/random/en.asad")
      .then((response) => response.json())
      .then((data) => {
        setVerse({
          text: data.data.text,
          surah: data.data.surah.englishName,
          ayahNumber: data.data.numberInSurah,
        });
      })
      .catch((error) => console.error("Error fetching verse:", error));
  }, []);

  return (
    <section
      className="relative bg-cover bg-center h-[80vh] flex items-center justify-center text-center text-background"
      style={{
        backgroundImage:
          "url('https://unsplash.com/photos/dri5ZiEWQWw/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8bW91c3F1ZXxlbnwwfHx8fDE3MzQwMzQ3NzR8MA&force=true&w=2400')",
      }}
    >
      <div className="bg-black bg-opacity-50 p-8 rounded-lg max-w-2xl">
        {verse ? (
          <>
            <h1 className="text-4xl font-bold mb-4">“{verse.text}”</h1>
            <p className="text-lg mb-6">
              Surah {verse.surah} - Ayah {verse.ayahNumber}
            </p>
            <a
              href="/quran"
              className="bg-accent text-background px-6 py-3 rounded-lg hover:bg-secondary transition"
            >
              Explore the Quran
            </a>
          </>
        ) : (
          <p className="text-lg">Loading a beautiful verse for you...</p>
        )}
      </div>
    </section>
  );
};

export default Hero;
