"use client";

import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedDuas from "@/components/FeaturedDuas";
import AboutUs from "@/components/AboutUs";
import Footer from "@/components/Footer";
import WhyQuranIsTheBestBook from "@/components/WhyQuranIsTheBestBook";
import QuranIsNotJustForMuslims from "@/components/QuranIsNotJustForMuslims";
import WhyFindSolutionsInQuran from "@/components/WhyFindSolutionsInQuran";
import WhatsInsideQuran from "@/components/WhatsInsideQuran";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="bg-background font-monsterate text-primary">
      {/* Hero Section */}
      <Hero />

      {/* Multi-Row Image + Text Section: Why Solutions in Quran */}
      <motion.div
        className="py-10 px-5 items-center gap-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <WhyFindSolutionsInQuran />
      </motion.div>

      {/* Categories Section */}
      <Categories />

      {/* Why Quran is the Ultimate Solution */}
      <motion.div
        className="py-10 px-5  items-center gap-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <WhyQuranIsTheBestBook />
      </motion.div>

      {/* Featured Duas Section */}
      <FeaturedDuas />

      {/* What&apos;s Inside Quran */}
      <motion.div
        className="py-10 px-5 grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <WhatsInsideQuran />
        <QuranIsNotJustForMuslims />
      </motion.div>

      {/* About Us Section */}
      <AboutUs />

      {/* CTA Section */}
      <motion.div
        className="bg-accent text-white py-10 px-5 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-4">
          Contact Me for Next App Development
        </h2>
        <p className="text-lg">
          Let&apos;s create something amazing together! Reach out to discuss
          your project.
        </p>
        <button className="mt-5 px-6 py-3 bg-primary text-white rounded-lg shadow-lg">
          Contact Now
        </button>
      </motion.div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
