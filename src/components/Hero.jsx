const Hero = async () => {
  const fetchVerse = async () => {
    const NEXT_PUBLIC_BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${NEXT_PUBLIC_BASE_URL}/api/quran/random`);

    if (!response.ok) {
      throw new Error("Failed to fetch verse");
    }

    const data = await response.json();

    return data;
  };

  const verse = await fetchVerse();

  return (
    <section
      className="relative w-full bg-cover bg-center h-[80vh] flex items-center justify-center text-center text-background"
      style={{
        backgroundImage:
          "url('https://unsplash.com/photos/dri5ZiEWQWw/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8bW91c3F1ZXxlbnwwfHx8fDE3MzQwMzQ3NzR8MA&force=true&w=2400')",
      }}
    >
      <div className="bg-black flex items-center flex-col bg-opacity-60 p-8 rounded-lg max-w-6xl w-full text-white">
        {verse ? (
          <>
            <h1 className="text-xl font-bold mb-4">“{verse.english}”</h1>
            <p className="text-lg mb-4">
              <strong></strong> <span>{verse.arabic}</span>
            </p>
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
        ) : (
          <p className="text-lg">Loading a beautiful verse for you...</p>
        )}
      </div>
    </section>
  );
};

export default Hero;
