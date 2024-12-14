import Image from "next/image";

export default function About() {
  return (
    <div className="bg-background text-primary font-monsterate">
      <div className="max-w-6xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-bold mb-6 text-center">
          About Quran-Wise
        </h1>
        <p className="text-lg text-secondary leading-relaxed text-center mb-8">
          Quran-Wise is your comprehensive platform for exploring the
          Quran&apos;s timeless wisdom. Whether you&apos;re seeking guidance,
          education, or simply want to connect with the Quran&apos;s message,
          Quran-Wise offers a beautifully designed and intuitive experience.
        </p>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Mission */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🌟 Our Mission</h2>
            <p className="text-secondary leading-relaxed">
              To make the Quran accessible to everyone, bridging language and
              cultural barriers, and promoting understanding, reflection, and
              peace.
            </p>
          </div>
          {/* Vision */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📖 Our Vision</h2>
            <p className="text-secondary leading-relaxed">
              To empower individuals with the knowledge of the Quran by
              providing seamless access to translations, audio recitations, and
              tools for learning and contemplation.
            </p>
          </div>
          {/* Features */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">✨ Key Features</h2>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li>
                Verse-by-verse reading experience with translations and audio.
              </li>
              <li>
                Engage with the Quran through advanced search and query tools.
              </li>
              <li>
                Explore widgets like prayer times and more for daily life.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Meet The Developer</h2>
          <p className="text-lg text-secondary mb-6">
            Dedicated to delivering the best experience for users worldwide.
          </p>
          <div className="flex justify-center">
            {/* Team Member 1 */}
            <div className="bg-white shadow-md rounded-lg p-4 w-72">
              <Image
                src="/2.jpg"
                alt="Team Member 1"
                width={96}
                height={96}
                className="rounded-full w-24 h-24 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-center">
                Md. Salim Reza Joy
              </h3>
              <p className="text-secondary text-center">Full-Stack Developer</p>
            </div>
          </div>
        </div>
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-lg text-secondary mb-4">
            Have questions or feedback? We’d love to hear from you!
          </p>
          <a
            href="mailto:support@quran-wise.com"
            className="bg-accent text-white px-6 py-3 rounded-lg shadow-lg hover:bg-secondary"
          >
            Email Us: salimreza6835@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
