/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Note the addition of the `app` directory.
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B3030",
        secondary: "#664343",
        accent: "#795757",
        background: "#FFF0D1",
      },
      fontFamily: {
        monsterate: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
