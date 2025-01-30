import Link from "next/link";
import { useState } from "react";

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for hamburger menu
  
  return (
    <>
    <nav className="bg-black text-white p-4 shadow-md">
    <div className="container mx-auto flex justify-between items-center">
    {/* Logo */}
    <h1 className="text-2xl font-bold">
    <Link href="/">AgriInfo Portal</Link>
    </h1>
    
    {/* Hamburger Menu (Mobile) */}
    <button
    className="block md:hidden p-2 text-white focus:outline-none"
    onClick={() => setIsMenuOpen(!isMenuOpen)}
    >
    <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="w-6 h-6"
    >
    {isMenuOpen ? (
      <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
      />
    ) : (
      <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16M4 18h16"
      />
    )}
    </svg>
    </button>
    
    {/* Desktop Navigation */}
    <div className="hidden md:flex gap-4">
    <Link href="/" className="hover:underline">
    Home
    </Link>
    <Link href="/states" className="hover:underline">
    States
    </Link>
    <Link href="/crops" className="hover:underline">
    Crops
    </Link>
    <Link href="/about" className="hover:underline">
    About
    </Link>
    <Link href="/contact" className="hover:underline">
    Contact
    </Link>
    <Link href="/user-input" className="hover:underline">
    Input Data
    </Link>
    </div>
    </div>
    
    {/* Mobile Navigation */}
    {isMenuOpen && (
      <div className="md:hidden flex flex-col gap-2 mt-4">
      <Link href="/" className="hover:underline" onClick={() => setIsMenuOpen(false)}>
      Home
      </Link>
      <Link href="/states" className="hover:underline" onClick={() => setIsMenuOpen(false)}>
      States
      </Link>
      <Link href="/crops" className="hover:underline" onClick={() => setIsMenuOpen(false)}>
      Crops
      </Link>
      <Link href="/about" className="hover:underline" onClick={() => setIsMenuOpen(false)}>
      About
      </Link>
      <Link href="/contact" className="hover:underline" onClick={() => setIsMenuOpen(false)}>
      Contact
      </Link>
      <Link href="/user-input" className="hover:underline" onClick={() => setIsMenuOpen(false)}>
      Input Data
      </Link>
      </div>
    )}
    </nav>
    
    <main>{children}</main>
    
    <footer className="bg-black text-white p-4 mt-12">
    <div className="container mx-auto text-center">
    <p className="text-sm">
    &copy; {new Date().getFullYear()} AgriInfo Portal. All rights reserved.
    </p>
    </div>
    </footer>
    </>
  );
}
