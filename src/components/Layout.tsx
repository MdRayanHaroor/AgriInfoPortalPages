// src/components/Layout.tsx
import Link from "next/link";
import { useState, useContext, ReactNode } from "react";
import { AuthContext } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // dropdownOpen controls whether the dropdown is visible
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // dropdownPersistent controls whether a click on the username has locked the dropdown open
  const [dropdownPersistent, setDropdownPersistent] = useState(false);

  // Retrieve AuthContext and throw an error if it's undefined
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error(
      "AuthContext is undefined. Ensure that Layout is wrapped with AuthProvider."
    );
  }
  const { user, logout } = authContext;

  // Handle logout and then close the dropdown
  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setDropdownPersistent(false);
  };

  // Toggle persistent mode when the username is clicked
  const handleUsernameClick = () => {
    if (dropdownPersistent) {
      // If already persistent, turn it off (close the dropdown)
      setDropdownPersistent(false);
      setDropdownOpen(false);
    } else {
      // If not persistent, enable persistent mode and open the dropdown
      setDropdownPersistent(true);
      setDropdownOpen(true);
    }
  };

  // When hovering over the container, open the dropdown
  const handleMouseEnter = () => {
    setDropdownOpen(true);
  };

  // When leaving the container, close the dropdown only if not in persistent mode
  const handleMouseLeave = () => {
    if (!dropdownPersistent) {
      setDropdownOpen(false);
    }
  };

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
          <div className="hidden md:flex gap-4 items-center">
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

            {/* User Authentication Links */}
            {user ? (
              // Wrap the username button and dropdown in a container that listens for mouse events.
              <div
                className="relative inline-block"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={handleUsernameClick}
                  className="hover:underline focus:outline-none"
                >
                  {user.name} ⬇
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full w-32 bg-white text-black shadow-md rounded">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-gray-200"
                      onClick={() => {
                        setDropdownOpen(false);
                        setDropdownPersistent(false);
                      }}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hover:underline">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col gap-2 mt-4">
            <Link
              href="/"
              className="hover:underline"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/states"
              className="hover:underline"
              onClick={() => setIsMenuOpen(false)}
            >
              States
            </Link>
            <Link
              href="/crops"
              className="hover:underline"
              onClick={() => setIsMenuOpen(false)}
            >
              Crops
            </Link>
            <Link
              href="/about"
              className="hover:underline"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:underline"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/user-input"
              className="hover:underline"
              onClick={() => setIsMenuOpen(false)}
            >
              Input Data
            </Link>

            {/* Mobile Authentication Links */}
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hover:underline"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="hover:underline text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hover:underline"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
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
