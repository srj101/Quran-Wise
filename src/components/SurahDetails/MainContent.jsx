"use client";

import React, { useRef, useEffect } from "react";

function MainContent({ verses }) {
  const verseRefs = useRef([]);

  const handleScroll = () => {
    const positions = verseRefs.current.map((ref) =>
      ref ? ref.getBoundingClientRect().top : 0
    );
    const currentVerseIndex = positions.findIndex((pos) => pos > 0) - 1;
    window.dispatchEvent(
      new CustomEvent("verseChange", { detail: currentVerseIndex })
    );
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="main-content flex flex-col gap-6 py-8 bg-background text-primary font-monsterate md:pl-0">
      <div className="verse-card p-4 rounded-lg shadow-md bg-white">
        <div className="arabic text-right text-2xl font-bold text-accent mb-4">
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </div>
        <div className="translation text-lg text-secondary">
          In the name of God, the Most Gracious, the Most Merciful
        </div>
        <audio controls src={verses.bismillahaudio} className="mt-4 w-full">
          Your browser does not support the audio element.
        </audio>
      </div>

      {verses.verses.arabic.map((verse, index) => (
        <div
          key={index}
          ref={(el) => (verseRefs.current[index] = el)}
          className="verse-card p-4 rounded-lg shadow-md bg-white"
        >
          <div className="arabic text-right text-2xl font-bold text-accent mb-4">
            {verse}
          </div>
          <div className="translation text-lg text-secondary">
            {verses.verses.translation[index]}
          </div>
          <audio
            controls
            src={verses.verses.audio[index]}
            className="mt-4 w-full"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      ))}
    </div>
  );
}

export default MainContent;
