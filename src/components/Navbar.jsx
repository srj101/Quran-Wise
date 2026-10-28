import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-primary text-background p-4 shadow-md z-50 relative">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link href="/">Quran Compass</Link>
        </div>
        <ul className="flex space-x-6 text-lg">
          <li>
            <Link href="/quran" className="hover:text-accent transition">
              Quran
            </Link>
          </li>
          <li>
            <Link
              href="/tools"
              className="text-amber-200 hover:text-white font-semibold transition flex items-center gap-1.5"
            >
              <span>Tools</span>
              <span className="text-[10px] bg-amber-600/70 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Studio
              </span>
            </Link>
          </li>

          <li>
            <Link href="/widgets" className="hover:text-accent transition">
              Widgets
            </Link>
          </li>
          <li>
            <Link href="/discuss" className="hover:text-accent transition">
              Discuss
            </Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-accent transition">
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-accent transition">
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
