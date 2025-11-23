// components/Navbar.js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useUser } from "@/context/UserContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const { profileImage, fullName } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState(null);

  // Detect admin cookie/session on mount
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/admin/check", { credentials: "include" });
        const j = await res.json();
        if (!cancelled && j?.isAdmin) {
          setIsAdmin(true);
          if (j.email) setAdminEmail(j.email);
        } else {
          setIsAdmin(false);
          setAdminEmail(null);
        }
      } catch (e) {
        if (!cancelled) {
          setIsAdmin(false);
          setAdminEmail(null);
        }
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);
  try {
    console.log("Navbar:render", {
      fullName,
      sessionName: session?.user?.name,
      profileImage,
    });
  } catch (e) {}
  // Fallback to localStorage in case context or session lags
  let displayName = fullName;
  let displayImage = profileImage;
  try {
    if (!displayName && typeof window !== "undefined") {
      const stored = localStorage.getItem("lf_full_name");
      if (stored) displayName = stored;
    }
    if (!displayImage && typeof window !== "undefined") {
      const storedImg = localStorage.getItem("lf_profile_image");
      if (storedImg) displayImage = storedImg;
    }
  } catch (e) {}

  return (
    <header className="fixed top-0 w-full bg-linear-to-r from-blue-100 via-white to-blue-100 backdrop-blur-lg shadow-lg z-50 transition-all duration-500">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="text-3xl font-extrabold text-blue-700 tracking-wide drop-shadow-lg font-geist-sans animate-slide-down">
            ELIF
          </div>
          <div className="text-base text-gray-700 italic font-geist-sans animate-slide-up">
            Even Lost, I Found
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center text-gray-800 font-medium font-geist-sans">
          <Link
            href="/"
            className="relative group hover:text-blue-700 transition duration-300 scale-105 pb-1"
          >
            Home
            <span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Link>
          <Link
            href="/lost"
            className="relative group hover:text-blue-700 transition duration-300 scale-105 pb-1"
          >
            Lost Items
            <span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Link>
          <Link
            href={session || isAdmin ? "/found" : "/auth/login"}
            className="relative group hover:text-blue-700 transition duration-300 scale-105 pb-1"
          >
            Found Items
            <span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Link>
          {!isAdmin && (
            <Link
              href={session ? "/report" : "/auth/login"}
              className="relative group hover:text-blue-700 transition duration-300 scale-105 pb-1"
            >
              Report Item
              <span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
          )}
          {session && !isAdmin && (
            <Link
              href="/profile"
              className="relative group hover:text-blue-700 transition duration-300 scale-105 pb-1"
            >
              Profile
              <span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="relative group hover:text-yellow-700 transition duration-300 scale-105 pb-1"
            >
              Dashboard
              <span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-yellow-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin ? (
            <>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2 border border-yellow-500 rounded-lg bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
              >
                <strong className="mr-2">Admin</strong>
                <span className="text-sm">{adminEmail || "(admin)"}</span>
              </Link>
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/admin/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                  } catch (e) {}
                  // force reload to clear state
                  window.location.href = "/admin/login";
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition font-geist-sans"
              >
                Logout
              </button>
            </>
          ) : session ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-geist-sans"
              >
                {displayImage || session.user?.image ? (
                  <img
                    src={displayImage || session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {(displayName || session.user?.name)?.[0] || "U"}
                  </span>
                )}
                <span>
                  {displayName || session.user?.name || session.user?.email}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition font-geist-sans"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-geist-sans"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 transition font-geist-sans"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-8 h-8 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
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
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg shadow-xl animate-fade-in">
          <nav className="flex flex-col px-4 py-4 gap-4 text-gray-800 font-geist-sans">
            <Link
              href="/"
              className="hover:text-blue-700 transition duration-300"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/lost"
              className="hover:text-blue-700 transition duration-300"
              onClick={() => setIsOpen(false)}
            >
              Lost Items
            </Link>
            <Link
              href={session || isAdmin ? "/found" : "/auth/login"}
              className="hover:text-blue-700 transition duration-300"
              onClick={() => setIsOpen(false)}
            >
              Found Items
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="hover:text-yellow-700 transition duration-300"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href={session ? "/report" : "/auth/login"}
                className="hover:text-blue-700 transition duration-300"
                onClick={() => setIsOpen(false)}
              >
                Report Item
              </Link>
            )}
            {session && !isAdmin && (
              <Link
                href="/profile"
                className="hover:text-blue-700 transition duration-300"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
            )}
            {isAdmin ? (
              <button
                onClick={async () => {
                  setIsOpen(false);
                  try {
                    await fetch("/api/admin/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                  } catch (e) {}
                  window.location.href = "/admin/login";
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              >
                Logout
              </button>
            ) : session ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/auth/login" });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
