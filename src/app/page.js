// pages/index.js
import Link from "next/link";

export default function Home() {
  return (
    <section className="px-4 py-16 mt-32">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        <h1
          className="text-6xl sm:text-7xl font-extrabold mb-4 font-bebas-neue drop-shadow-xl tracking-wide"
          style={{
            background:
              "linear-gradient(90deg, #1d4ed8 0%, #6366f1 50%, #22d3ee 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Even Lost, I Found
        </h1>
        <p className="text-gray-700 text-xl sm:text-2xl mb-8 font-geist-sans">
          The community platform that connects people who have lost items with
          those who have found them.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-6">
          <Link
            href="/report"
            className="px-7 py-3 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transition font-geist-sans text-base flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Report an Item
          </Link>
          <Link
            href="/lost"
            className="px-7 py-3 border border-blue-700 rounded-xl hover:bg-blue-50 transition font-geist-sans text-base flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Search Lost Items
          </Link>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-geist-sans text-sm shadow">
            Fast & Secure
          </span>
          <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-geist-sans text-sm shadow">
            Verified Community
          </span>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12 lg:gap-16 items-start justify-center">
            <div className="w-full max-w-sm mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:scale-105 transition-transform h-full flex">
              <div className="flex-1 flex flex-col justify-between items-center text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 19V6M5 12l7-7 7 7" />
                  </svg>
                </div>
                <div className="px-2">
                  <h3 className="font-medium mb-2 text-lg font-geist-sans">
                    Report Lost Items
                  </h3>
                  <p className="text-base text-gray-700 text-center font-geist-sans">
                    Quickly report your lost items with details and images to
                    increase your chances of finding them.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:scale-105 transition-transform h-full flex">
              <div className="flex-1 flex flex-col justify-between items-center text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div className="px-2">
                  <h3 className="font-medium mb-2 text-lg font-geist-sans">
                    Find Items
                  </h3>
                  <p className="text-base text-gray-700 text-center font-geist-sans">
                    Search for items by category, location, and date.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:scale-105 transition-transform h-full flex">
              <div className="flex-1 flex flex-col justify-between items-center text-center">
                <div className="h-16 w-16 rounded-full bg-yellow-100 mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="px-2">
                  <h3 className="font-medium mb-2 text-lg font-geist-sans">
                    Verification System
                  </h3>
                  <p className="text-base text-gray-700 text-center font-geist-sans">
                    Ensures that items are returned to their rightful owners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
