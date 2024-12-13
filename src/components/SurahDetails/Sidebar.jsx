"use client"; // Mark as client-side component

import React, { useState, useEffect } from "react";
import RightSidebar from "@/components/SurahDetails/RightSidebar";

function Sidebar({ verses, chapters }) {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(false); // Default to hidden on mobile

  useEffect(() => {
    const updateVerse = (e) => setCurrentVerseIndex(e.detail);
    window.addEventListener("verseChange", updateVerse);

    return () => {
      window.removeEventListener("verseChange", updateVerse);
    };
  }, []);

  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="w-1/6 max-w-24">
      {/* Toggle Button (Caret) */}
      <button
        onClick={toggleSidebar}
        className="p-2 bg-gray-300 rounded-full 2xl:hidden fixed top-20  left-4 z-20"
      >
        <span className="text-xl">{sidebarVisible ? "▲" : "▼"}</span>
      </button>

      {/* Sidebar */}
      <div
        className={` ${
          sidebarVisible ? "block" : "hidden"
        } 2xl:block transition-all duration-300`}
      >
        <div className="sidebar fixed top-0 left-0 h-full p-4 bg-secondary text-white z-10 max-w-48">
          <h2 className="text-2xl font-bold mb-4 pt-14">Surah Details</h2>
          <p className="text-lg mb-2">
            Current Verse: {verses.verses.arabic[currentVerseIndex]}
          </p>
          <p className="mb-4">
            Verse {currentVerseIndex + 1} of {verses.totalAyah}
          </p>
          <p className="text-lg">
            Surah: {verses.surahNameTranslation} ({verses.surahNameArabic})
          </p>
          <p className="mb-4">Revelation Place: {verses.revelationPlace}</p>
          <div className="progress-bar bg-accent h-2 w-full mt-6 rounded">
            <div
              style={{
                width: `${((currentVerseIndex + 1) / verses.totalAyah) * 100}%`,
              }}
              className="bg-white h-full rounded"
            ></div>
          </div>

          <div className="mt-4">
            <RightSidebar chapters={chapters} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
