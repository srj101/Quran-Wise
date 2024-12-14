"use client";

export default function WidgetsPage() {
  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-primary mb-6">
          Islamic Widgets
        </h1>
        <p className="text-center text-secondary mb-10">
          Explore useful Islamic widgets below. They include prayer times,
          Quran, Hijri calendar, and more.
        </p>

        {/* Prayer Times Widget */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Prayer Times
          </h2>
          <div className="overflow-hidden rounded-lg shadow-lg bg-white">
            <iframe
              title="Prayer Times Widget"
              src="https://www.islamicfinder.org/prayer-widget/"
              width="100%"
              height="360"
              className="w-full"
            ></iframe>
          </div>
        </div>

        {/* Quran Widget */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Gregorian/Hijri Date Converter
          </h2>
          <div className="overflow-hidden rounded-lg shadow-lg bg-white">
            <iframe
              id="iframe2"
              title="dateconvertor-widget"
              src="https://www.islamicfinder.org/dateconvertor-widget"
              width="100%"
              height="145"
              className="w-full"
            ></iframe>
          </div>
        </div>

        {/* IslamicFinder Advertisement (Optional) */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Widgets provided by{" "}
            <a
              href="https://www.islamicfinder.org/widgets/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              IslamicFinder
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
