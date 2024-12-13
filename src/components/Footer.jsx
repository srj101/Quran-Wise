"use client";

import { useEffect, useState } from "react";

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(2024); // Fallback to a default year

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-primary text-background py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div>
          <p className="text-sm">
            © {currentYear} QuranWise. All rights reserved. Developed by
            {" SR Joy "}
          </p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a
            href="/about"
            className="text-background hover:text-secondary transition"
          >
            About Us
          </a>
          <a
            href="/contact"
            className="text-background hover:text-secondary transition"
          >
            Contact
          </a>
          <a
            href="/privacy"
            className="text-background hover:text-secondary transition"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
