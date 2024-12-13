"use client";

import Link from "next/link";

function RightSidebar({ chapters }) {
  return (
    <div>
      <h3 className="text-2xl mb-6">Chapters</h3>
      <ul className="space-y-4">
        {chapters.map((chapter, i) => (
          <li key={i} className="border-b border-gray-200">
            <Link
              href={`/quran/${i + 1}`}
              className="block rounded-lg text-md hover:bg-primary hover:text-white transition duration-300"
            >
              {chapter.surahName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RightSidebar;
