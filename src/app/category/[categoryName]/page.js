"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { CircularProgress } from "@mui/material"; // Import Material-UI Circular Progress for loading state

const DuasList = ({ dua }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h4 className="text-xl font-semibold text-secondary mb-4">Duas:</h4>

      <ul className="space-y-3">
        {dua.map((duaItem, index) => (
          <li
            key={index}
            className="text-lg text-gray-700 p-2 bg-gray-100 rounded-md"
          >
            {duaItem}
          </li>
        ))}
      </ul>
    </div>
  );
};

const VerseList = ({ verses }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md text-left mb-5">
      <h4 className="text-2xl font-bold text-secondary mb-6 border-b pb-3">
        Relevant Quranic Verses
      </h4>

      <div className="space-y-4">
        {verses.map((verse, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-lg border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="text-primary text-3xl font-semibold">📜</div>
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-800">
                  Surah {verse.verse_key.split(":")[0]}, Ayah{" "}
                  {verse.verse_key.split(":")[1]}
                </p>
                <p className="mt-2 text-gray-700 leading-relaxed">
                  {verse.text}
                </p>
                <p className="mt-2 text-gray-700 leading-relaxed">
                  {verse.translations[0].text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoryDetails = () => {
  const [categoryImage, setCategoryImage] = useState(null);
  const [categoryName, setCategoryName] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryFromPath = pathname.split("/").pop();
    const categoryFromQuery = searchParams.get("categoryName");

    const category = categoryFromPath || categoryFromQuery;

    if (category) {
      setCategoryName(category);
      fetchCategoryImage(category);
      fetchCategoryData(category);
    }
  }, [pathname, searchParams]);

  const fetchCategoryImage = async (categoryName) => {
    try {
      const response = await axios.get(`/api/pexels?query=${categoryName}`);
      if (response.data?.imageUrl) {
        setCategoryImage(response.data.imageUrl);
      } else {
        setCategoryImage(null);
      }
    } catch (error) {
      setError("Error fetching image");
      console.error("Error fetching image from API:", error);
    }
  };

  const fetchCategoryData = async (categoryName) => {
    try {
      const response = await axios.get(
        `/api/quran/fetchCategory?categoryName=${categoryName}`
      );
      if (response.data) {
        console.log(response.data);
        setCategoryData(response.data);
      }
      setLoading(false); // Set loading to false when data is fetched
    } catch (error) {
      setError("Error fetching category data");
      console.error("Error fetching category data:", error);
      setLoading(false); // Set loading to false even if there is an error
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />{" "}
        {/* Material-UI Circular Progress as loading indicator */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-500">
          Something went wrong!
        </h2>
        <p className="text-lg">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchCategoryImage(categoryName);
            fetchCategoryData(categoryName);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="py-16 bg-background text-text">
      <div className="container mx-auto text-center">
        <h3 className="text-xl font-semibold text-primary mb-4 uppercase">
          Quranic Guidance on {categoryName || "Loading..."}
        </h3>

        {categoryImage ? (
          <div className="relative w-full h-64 mb-4">
            <Image
              src={categoryImage}
              alt={categoryName}
              className="object-cover rounded-md"
              layout="fill"
            />
          </div>
        ) : (
          <p className="text-lg font-semibold text-gray-500">
            No image available for this category
          </p>
        )}

        {categoryData && (
          <div className="mt-8">
            <div className="max-w-3xl mx-auto">
              <VerseList verses={categoryData.description} />

              <div className="mb-8">
                <h4 className="text-lg font-medium text-secondary mb-2">
                  Prophet’s Guidance:
                </h4>
                <p className="text-lg text-gray-700">
                  {categoryData.prophetGuidance}
                </p>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-medium text-secondary mb-2">
                  Allah’s Guidance:
                </h4>
                <p className="text-lg text-gray-700">
                  {categoryData.allahGuidance}
                </p>
              </div>

              <DuasList dua={categoryData.relevantDuas} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryDetails;
