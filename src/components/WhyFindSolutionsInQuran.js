import Image from "next/image";

export default function WhyFindSolutionsInQuran() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="md:w-1/2">
        <Image
          src="https://images.pexels.com/photos/36704/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          alt="Why Find Solutions in Quran"
          width={500}
          height={300}
          className="rounded-lg shadow-md"
        />
      </div>
      <div className="md:w-1/2">
        <h2 className="text-2xl font-bold mb-4">
          Why Should You Find Solutions in the Quran?
        </h2>
        <p className="text-lg leading-relaxed">
          The Quran offers timeless wisdom and guidance for all aspects of life.
          Whether you seek personal growth, community harmony, or spiritual
          clarity, the Quran provides answers that are as relevant today as they
          were centuries ago.
        </p>
      </div>
    </div>
  );
}
