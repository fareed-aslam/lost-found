"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-linear-to-br from-blue-100 via-white to-blue-200">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-8 border-blue-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-4 rounded-full border-4 border-blue-200 border-b-transparent animate-spin-slow"></div>
          <div className="absolute inset-8 rounded-full bg-blue-700"></div>
        </div>
        <h2 className="text-2xl font-medium text-blue-700 font-geist-sans animate-fade-in">
          Loading ELIF...
        </h2>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 2.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
