import Image from "next/image";

export default function WhyQuranIsTheBestBook() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="md:w-1/2">
        <h2 className="text-2xl font-bold mb-4">Why Quran is the Best Book</h2>
        <p className="text-lg leading-relaxed">
          The Quran is unmatched in its literary excellence, depth of meaning,
          and comprehensive guidance. It serves as a manual for humanity,
          transcending cultural and religious boundaries with its universal
          messages of peace, justice, and compassion.
        </p>
      </div>
      <div className="md:w-1/2">
        <Image
          src="https://unsplash.com/photos/sfmsMZ7ezXw/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8cXVyYW58ZW58MHx8fHwxNzM0MTc1NTc0fDA&force=true&w=2400"
          alt="Why Quran is the Best Book"
          width={1000}
          height={250}
          className="rounded-lg shadow-md max-h-96"
        />
      </div>
    </div>
  );
}
