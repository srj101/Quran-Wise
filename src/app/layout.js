import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Quran Compass",
  description:
    "Find solutions to real-life problems with guidance from the Quran.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {/* Flex container for sidebar and main content */}
        <div className="flex relative">
          <main className="container mx-auto py-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
