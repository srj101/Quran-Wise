// Import necessary modules
import fetch from "node-fetch"; // For external API calls
import axios from "axios"; // For fetching data from Dua Explorer

// Predefined guidance data mapping
const guidanceData = {
  health: {
    prophetGuidance:
      "Maintain cleanliness and seek medical treatment when ill.",
    allahGuidance:
      "Allah encourages us to take care of our bodies and seek health.",
    shortDua: "O Allah, grant me good health and protect me from illness.",
  },
  food: {
    prophetGuidance:
      "Eat in moderation, and remember to say Bismillah before eating.",
    allahGuidance: "Allah provides sustenance for all of His creation.",
    shortDua: "O Allah, bless this food and make it beneficial for me.",
  },
  cloth: {
    prophetGuidance: "Wear modest clothes and take care of your appearance.",
    allahGuidance:
      "Allah has provided clothing to cover ourselves with dignity.",
    shortDua:
      "O Allah, bless me with the best of clothing and protect me from harm.",
  },
  education: {
    prophetGuidance: "Seek knowledge from the cradle to the grave.",
    allahGuidance: "Allah elevates those who seek knowledge.",
    shortDua:
      "O Allah, grant me beneficial knowledge and make me patient in learning.",
  },
  medicine: {
    prophetGuidance:
      "Seek medical treatment for illness, as Allah has created cures for every disease.",
    allahGuidance:
      "Allah is the Healer, and He provides cures for all ailments.",
    shortDua: "O Allah, heal me and grant me complete recovery.",
  },
  finance: {
    prophetGuidance:
      "Be honest in business dealings, and do not engage in usury.",
    allahGuidance:
      "Allah promises prosperity to those who are honest in their dealings.",
    shortDua: "O Allah, bless me with barakah in my wealth and provide for me.",
  },
  family: {
    prophetGuidance: "Treat your family with kindness, respect, and patience.",
    allahGuidance:
      "Allah emphasizes the importance of family ties and good treatment of parents.",
    shortDua:
      "O Allah, bless my family and keep us united in love and respect.",
  },
  work: {
    prophetGuidance:
      "Work hard and be diligent in your profession, seeking honesty and integrity.",
    allahGuidance:
      "Allah rewards the one who works with sincerity and strives to do good.",
    shortDua:
      "O Allah, bless my work and make it a source of growth and success.",
  },
  friendship: {
    prophetGuidance:
      "Choose friends who remind you of Allah and help you become a better person.",
    allahGuidance:
      "Allah warns us against bad company that leads us away from His path.",
    shortDua: "O Allah, grant me righteous friends who remind me of You.",
  },
  love: {
    prophetGuidance: "Love for your brother what you love for yourself.",
    allahGuidance:
      "Allah is the source of love and mercy, and He loves those who love others for His sake.",
    shortDua: "O Allah, grant me love for my brothers and sisters in faith.",
  },
  gratitude: {
    prophetGuidance: "The one who does not thank people does not thank Allah.",
    allahGuidance: "Allah loves those who are grateful for His blessings.",
    shortDua: "O Allah, make me among the grateful.",
  },
  patience: {
    prophetGuidance:
      "Patience is half of faith, and Allah is with those who are patient.",
    allahGuidance:
      "Allah promises great rewards for those who are patient in times of difficulty.",
    shortDua: "O Allah, grant me patience and make me among the steadfast.",
  },
};
const duasData = {
  health: [
    "O Allah, grant me good health and protect me from all illnesses.",
    "O Allah, heal me and remove my pain.",
    "O Allah, make me strong and free from any disease.",
  ],
  food: [
    "O Allah, bless this food and make it beneficial for me.",
    "O Allah, grant me sustenance and keep me grateful.",
    "O Allah, provide for me and my family with the best of food.",
  ],
  cloth: [
    "O Allah, bless me with good clothing and protect me from harm.",
    "O Allah, make this clothing a source of comfort and dignity for me.",
    "O Allah, provide me with modest clothes and protect my dignity.",
  ],
  education: [
    "O Allah, grant me beneficial knowledge and make me patient in learning.",
    "O Allah, open my heart to knowledge and help me understand.",
    "O Allah, make learning easy for me and grant me wisdom.",
  ],
  medicine: [
    "O Allah, grant me healing and cure from all ailments.",
    "O Allah, you are the Healer, cure me from this sickness.",
    "O Allah, remove all suffering and grant me a speedy recovery.",
  ],
  finance: [
    "O Allah, bless me with barakah in my wealth and provide for me.",
    "O Allah, make my wealth a means of good and a blessing.",
    "O Allah, guide me to use my wealth in the right way.",
  ],
  family: [
    "O Allah, bless my family and bring us closer to You.",
    "O Allah, make my family a source of love, peace, and support.",
    "O Allah, protect my family and keep us united.",
  ],
  work: [
    "O Allah, bless my work and make it a means of growth and success.",
    "O Allah, help me excel in my profession and make it beneficial.",
    "O Allah, make my work a means of provision and satisfaction.",
  ],
  friendship: [
    "O Allah, grant me righteous friends who remind me of You.",
    "O Allah, protect me from bad company and guide me to good friends.",
    "O Allah, make me a source of goodness for my friends.",
  ],
  love: [
    "O Allah, grant me love for my brothers and sisters in faith.",
    "O Allah, fill my heart with love and compassion for others.",
    "O Allah, make me among those who love for Your sake.",
  ],
  gratitude: [
    "O Allah, make me among the grateful.",
    "O Allah, help me recognize Your blessings and be thankful.",
    "O Allah, grant me a heart that is grateful and content.",
  ],
  patience: [
    "O Allah, grant me patience and make me among the steadfast.",
    "O Allah, help me endure difficulties with patience and faith.",
    "O Allah, make me strong in times of trial and tribulation.",
  ],
};

const getCategoryDuas = (categoryName) => {
  const categoryDuas = duasData[categoryName.toLowerCase()]; // Convert category name to lowercase for consistency

  if (categoryDuas) {
    return categoryDuas;
  } else {
    return ["Du'a not available for this category."];
  }
};

const RAPID_API_KEY = process.env.RAPID_API_KEY; // Retrieve RapidAPI key from environment variables

// This route handles GET requests
export async function GET(request) {
  const urlParams = new URL(request.url).searchParams;
  const searchTerm = urlParams.get("categoryName")?.toLowerCase() || "default";

  try {
    // Fetch Quranic verses based on the search term
    const categoryData = await fetchQuranCategoryData(searchTerm);

    // Fetch relevant Duas from Dua Explorer
    const relevantDuas = getCategoryDuas(searchTerm);

    // Retrieve Prophet's Guidance, Allah's Guidance, and Du'a from predefined data
    const additionalData = generateAdditionalGuidance(searchTerm);

    return new Response(
      JSON.stringify({ ...categoryData, ...additionalData, relevantDuas }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching category data:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching category data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Fetch Quranic verses related to the search term// Function to fetch Quranic verses based on category using Al Quran Cloud API
// Fetch Quranic verses related to the search term using RapidAPI
const fetchQuranCategoryData = async (searchTerm) => {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://api.quran.com/api/v4/search?q=${encodeURIComponent(
      searchTerm
    )}`,
    headers: {},
  };

  try {
    const response = await axios(config);
    const result = response.data;
    // Check if results exist
    if (!result || result.length === 0) {
      throw new Error("No results found for the given search term.");
    }

    // Return the verse description and related Duas
    return {
      description: result.search.results,
      dua: getCategoryDuas(searchTerm), // Fetch relevant Duas as before
    };
  } catch (error) {
    console.error("Error fetching Quran data:", error);
    throw new Error("Error fetching data from the external Quran API");
  }
};

// Retrieve Prophet's Guidance, Allah's Guidance, and Du'a from predefined data
const generateAdditionalGuidance = (searchTerm) => {
  if (guidanceData[searchTerm]) {
    return guidanceData[searchTerm];
  } else {
    return {
      prophetGuidance: "Guidance not available for this category.",
      allahGuidance: "Guidance not available for this category.",
      shortDua: "Du'a not available for this category.",
    };
  }
};
