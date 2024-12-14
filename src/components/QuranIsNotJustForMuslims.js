"use client";

import Image from "next/image";

export default function QuranIsNotJustForMuslims() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="md:w-1/2">
        <h2 className="text-2xl font-bold mb-4">
          Quran Is Not Just for Muslims
        </h2>
        <p className="text-lg leading-relaxed">
          The Quran&apos;s teachings go beyond religious boundaries. Its
          principles of justice, compassion, and truth are universal, providing
          valuable insights for anyone seeking a better understanding of life
          and the world around them.
        </p>
      </div>
      <div className="md:w-1/2">
        <Image
          src="https://images.pexels.com/photos/2895295/pexels-photo-2895295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          alt="Quran Is Not Just for Muslims"
          width={500}
          height={300}
          className="rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}
