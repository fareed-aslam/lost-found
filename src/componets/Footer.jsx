// components/Footer.js
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-linear-to-r from-blue-100 via-white to-blue-100 border-t mt-12 shadow-lg rounded-t-2xl">
      <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between items-center">
        {/* Left side */}
        <p className="text-blue-700 text-base font-geist-sans font-semibold drop-shadow">
          &copy; 2024 ELIF. All rights reserved.
        </p>

        {/* Right side links */}
        <div className="flex flex-col sm:flex-row gap-6 mt-4 sm:mt-0 text-blue-700 text-base font-geist-sans">
          <Link
            href="/privacy"
            className="hover:underline hover:text-blue-900 transition"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:underline hover:text-blue-900 transition"
          >
            Terms of Service
          </Link>
          <Link
            href="/contact"
            className="hover:underline hover:text-blue-900 transition"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
