"use client";

import React from "react";
import Link from "next/link";

const CallToAction = () => {
  return (
    <section className="bg-secondary text-white text-center py-12 space-y-6">
      <h2 className="text-4xl font-bold">Start Your Journey with the Quran</h2>
      <p className="text-lg">
        Explore the divine guidance and solutions that the Quran offers.
        It&apos;s time to make a change.
      </p>
      <div className="flex justify-center space-x-6">
        <Link
          href="/pages"
          className="bg-primary text-white py-3 px-6 rounded-lg hover:bg-accent transition duration-300"
        >
          Explore Pages
        </Link>
        <Link
          href="/contact"
          className="bg-accent text-white py-3 px-6 rounded-lg hover:bg-primary transition duration-300"
        >
          Contact Us for Development
        </Link>
      </div>
    </section>
  );
};

export default CallToAction;
