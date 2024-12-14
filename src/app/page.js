import Categories from "@/components/Categories";
import FeaturedDuas from "@/components/FeaturedDuas";
import AboutUs from "@/components/AboutUs";
import Footer from "@/components/Footer";
import WhyQuranIsTheBestBook from "@/components/WhyQuranIsTheBestBook";
import QuranIsNotJustForMuslims from "@/components/QuranIsNotJustForMuslims";
import WhyFindSolutionsInQuran from "@/components/WhyFindSolutionsInQuran";
import WhatsInsideQuran from "@/components/WhatsInsideQuran";

import Link from "next/link";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="bg-background font-monsterate text-primary">
      {/* Hero Section */}
      <Hero />
      {/* Multi-Row Image + Text Section: Why Solutions in Quran */}
      <div className="py-10 px-5 items-center gap-10">
        <WhyFindSolutionsInQuran />
      </div>

      {/* Categories Section */}
      <Categories />

      {/* Why Quran is the Ultimate Solution */}
      <div className="py-10 px-5  items-center gap-10">
        <WhyQuranIsTheBestBook />
      </div>

      {/* Featured Duas Section */}
      <FeaturedDuas />

      {/* What&apos;s Inside Quran */}
      <div className="py-10 px-5 grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-10">
        <WhatsInsideQuran />
        <QuranIsNotJustForMuslims />
      </div>

      {/* About Us Section */}
      <AboutUs />

      {/* CTA Section */}
      <div className="bg-accent text-white py-10 px-5 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Contact Me for Next App Development
        </h2>
        <p className="text-lg mb-5">
          Let&apos;s create something amazing together! Reach out to discuss
          your project.
        </p>
        <Link
          href="/contact"
          className="mt-5 px-6 py-3 bg-secondary text-white rounded-lg shadow-lg hover:bg-primary transition duration-300"
        >
          Contact Me
        </Link>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
