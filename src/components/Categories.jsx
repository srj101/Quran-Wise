"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

const categories = [
  {
    id: 1,
    name: "Health",
    imageUrl:
      "https://unsplash.com/photos/k7ll1hpdhFA/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8aGVhbHRofGVufDB8fHx8MTczNDA5MjAzOXww&force=true&w=640",
  },
  {
    id: 2,
    name: "Food",
    imageUrl:
      "https://unsplash.com/photos/1SPu0KT-Ejg/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8Nnx8Zm9vZHxlbnwwfHx8fDE3MzQwOTIxMDl8MA&force=true&w=640",
  },
  {
    id: 3,
    name: "Clothing",
    imageUrl:
      "https://unsplash.com/photos/vmO2vv4ICyk/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8aGFsYWwlMjBDbG90aGluZ3xlbnwwfHx8fDE3MzQwOTIxNDN8MA&force=true&w=640",
  },
  {
    id: 4,
    name: "Education",
    imageUrl:
      "https://unsplash.com/photos/jEEYZsaxbH4/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fEVkdWNhdGlvbnxlbnwwfHx8fDE3MzQwOTIxNzV8MA&force=true&w=640",
  },
  {
    id: 5,
    name: "Medicine",
    imageUrl:
      "https://unsplash.com/photos/HtDQ9Z64Vpo/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8TWVkaWNpbmV8ZW58MHx8fHwxNzM0MDkyMjAyfDA&force=true&w=640",
  },
  {
    id: 6,
    name: "Finance",
    imageUrl:
      "https://unsplash.com/photos/m4MYftUIt_g/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTF8fEZpbmFuY2V8ZW58MHx8fHwxNzM0MDkyMjE3fDA&force=true&w=640",
  },
  {
    id: 7,
    name: "Family",
    imageUrl:
      "https://unsplash.com/photos/JcHS1a8ylIU/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8RmFtaWx5JTIwbXVzbGltfGVufDB8fHx8MTczNDA5MjI1OHww&force=true&w=640",
  },
  {
    id: 8,
    name: "Work",
    imageUrl:
      "https://unsplash.com/photos/hBuwVLcYTnA/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTR8fFdvcmt8ZW58MHx8fHwxNzM0MDkyMjkxfDA&force=true&w=640",
  },
  {
    id: 9,
    name: "Friendship",
    imageUrl:
      "https://unsplash.com/photos/KWKvvPdAC_Y/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8RnJpZW5kc2hpcCUyMG11c2xpbXxlbnwwfHx8fDE3MzQwOTIzMTV8MA&force=true&w=640",
  },
  {
    id: 10,
    name: "Love",
    imageUrl:
      "https://unsplash.com/photos/J6-016hv6Ys/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8Nnx8TG92ZSUyMG11c2xpbXxlbnwwfHx8fDE3MzQwOTIzMzF8MA&force=true&w=640",
  },
  {
    id: 11,
    name: "Gratitude",
    imageUrl:
      "https://unsplash.com/photos/VIr-KKzL2eg/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fEdyYXRpdHVkZXxlbnwwfHx8fDE3MzQwOTIzNDd8MA&force=true&w=640",
  },
  {
    id: 12,
    name: "Patience",
    imageUrl:
      "https://unsplash.com/photos/L226luSQFVM/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTZ8fFBhdGllbmNlfGVufDB8fHx8MTczNDA5MjM2OHww&force=true&w=640",
  },
];

const Categories = () => {
  return (
    <section className="py-16 bg-background text-text px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">
          Explore Solutions from the Quran
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.name.toLowerCase()}`}
              passHref
            >
              <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  width={800}
                  height={500}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />

                <h3 className="text-xl font-semibold text-primary">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
