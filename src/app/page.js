import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedDuas from "@/components/FeaturedDuas";
import AboutUs from "@/components/AboutUs";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <Hero />

      {/* Categories Section */}
      <Categories />

      {/* Featured Duas Section */}
      <FeaturedDuas />

      {/* About Us Section */}
      <AboutUs />

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
