import Image from "next/image";

export default function WhatsInsideQuran() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="md:w-1/2">
        <Image
          src="https://images.pexels.com/photos/3936216/pexels-photo-3936216.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          alt="What's Inside the Quran"
          width={500}
          height={300}
          className="rounded-lg shadow-md"
        />
      </div>
      <div className="md:w-1/2">
        <h2 className="text-2xl font-bold mb-4">
          What&apos;s Inside the Quran?
        </h2>
        <p className="text-lg leading-relaxed">
          The Quran contains guidance on morality, law, science, and
          spirituality. Its verses address everything from the creation of the
          universe to the intricacies of human relationships, making it a
          treasure trove of knowledge.
        </p>
      </div>
    </div>
  );
}
