import Link from "next/link";
import { useState, useContext, ReactNode } from "react";
import { AuthContext } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    setIsMenuOpen(false);
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

  // Navigation menu items
  const menuItems = [
    { href: "/", label: "Home" },
    { href: "/states", label: "States" },
    { href: "/crops", label: "Crops" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/user-input", label: "Input Data" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-green-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-bold flex items-center hover:text-green-200 transition"
              aria-label="AgriInfo Portal Home"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                />
              </svg>
              AgriInfo Portal
            </Link>
          </div>

          {/* Hamburger Menu (Mobile) */}
          <button
            className="md:hidden p-2 text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
          <div className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className="hover:text-green-200 transition"
              >
                {item.label}
              </Link>
            ))}

            {/* Admin Dashboard Link */}
            {user && user.role === "admin" && (
              <Link 
                href="/admin" 
                className="hover:text-green-200 transition"
              >
                Admin Dashboard
              </Link>
            )}

            {/* User Authentication Links */}
            {user ? (
              <div
                className="relative inline-block"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={handleUsernameClick}
                  className="hover:text-green-200 transition"
                >
                  {user.name} ⬇
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full w-32 bg-white text-black shadow-md rounded">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-green-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        setDropdownPersistent(false);
                      }}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-green-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="hover:text-green-200 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Rest of the component remains the same as in the previous implementation */}
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-green-700 py-4">
            <div className="container mx-auto px-4 space-y-3">
              {menuItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="block hover:bg-green-600 px-3 py-2 rounded transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {user && user.role === "admin" && (
                <Link 
                  href="/admin" 
                  className="block hover:bg-green-600 px-3 py-2 rounded transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block hover:bg-green-600 px-3 py-2 rounded transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left hover:bg-green-600 px-3 py-2 rounded transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block hover:bg-green-600 px-3 py-2 rounded transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex justify-center space-x-6">
            <Link 
              href="/about" 
              className="hover:text-green-300 transition"
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className="hover:text-green-300 transition"
            >
              Contact
            </Link>
            <a 
              href="https://github.com/MdRayanHaroor/AgriInfoPortalPages" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-green-300 transition"
            >
              GitHub
            </a>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} RR Agro Fresh. 
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}