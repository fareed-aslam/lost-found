"use client";
import React, { useState, useRef } from "react";
import { uploadOnCloudinary } from "../../utils/cloudinary";
import { Toaster, toast } from "sonner";

const categories = [
  "Electronics",
  "Bags",
  "Jewelry",
  "Accessories",
  "Documents",
  "Clothing",
  "Others",
];

export default function ReportItemPage() {
  // if admin is logged in, redirect to admin dashboard instead of showing report form
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/check", { credentials: "include" });
        const j = await res.json();
        if (!cancelled && j?.isAdmin) {
          window.location.href = "/admin";
        }
      } catch (e) {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [activeType, setActiveType] = useState("lost");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // images: array of { id, url, uploading, error }
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 mt-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Report an Item</h1>
      <p className="text-gray-600 mb-8">
        Please provide as much detail as possible to help with identification.
      </p>
      <form className="bg-white rounded-xl shadow p-8">
        <Toaster richColors position="top-center" />
        <div className="flex gap-2 mb-8">
          <button
            type="button"
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-base transition ${
              activeType === "lost"
                ? "bg-blue-700 text-white"
                : "bg-blue-50 text-blue-700"
            }`}
            onClick={() => setActiveType("lost")}
          >
            I Lost an Item
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-base transition ${
              activeType === "found"
                ? "bg-blue-700 text-white"
                : "bg-blue-50 text-blue-700"
            }`}
            onClick={() => setActiveType("found")}
          >
            I Found an Item
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name*
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Black Nike Backpack"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category*
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-100 border rounded-lg px-3 py-2 text-gray-700"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location*
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was it lost/found?"
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date*
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time*
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description*
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the item"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 min-h-20"
            required
          />
        </div>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone*
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email*
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              required
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos (optional)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                uploading ? "opacity-60 cursor-not-allowed" : ""
              }`}
              aria-label="Choose images to upload"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
                <path d="M8 7V5a4 4 0 0 1 8 0v2" />
              </svg>
              <span>{uploading ? "Uploading..." : "Choose Images"}</span>
            </button>
            <span className="text-sm text-gray-500">
              {images.length
                ? `${images.length} selected`
                : "No images selected"}
            </span>
            <input
              ref={fileInputRef}
              id="images-input"
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                // For each file, create a preview entry and upload
                setUploading(true);
                for (const f of files) {
                  const id = `${Date.now()}-${Math.random()}`;
                  const previewUrl = URL.createObjectURL(f);
                  setImages((s) => [
                    ...s,
                    { id, url: previewUrl, uploading: true, isLocal: true },
                  ]);
                  try {
                    const uploadedUrl = await uploadOnCloudinary(f);
                    // replace the preview with uploaded url and mark as remote
                    setImages((s) =>
                      s.map((it) =>
                        it.id === id
                          ? {
                              ...it,
                              url: uploadedUrl || it.url,
                              uploading: false,
                              isLocal: false,
                            }
                          : it
                      )
                    );
                    // revoke the local preview URL to free memory
                    try {
                      URL.revokeObjectURL(previewUrl);
                    } catch (_) {}
                  } catch (err) {
                    console.error("Image upload failed", err);
                    setImages((s) =>
                      s.map((it) =>
                        it.id === id
                          ? { ...it, uploading: false, error: true }
                          : it
                      )
                    );
                  }
                }
                // clear native input so selecting same files again will trigger onChange
                if (fileInputRef.current) fileInputRef.current.value = "";
                setUploading(false);
              }}
              className="sr-only"
            />
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative w-20 h-20 rounded overflow-hidden bg-gray-100"
              >
                <img
                  src={img.url}
                  alt={`preview-${img.id}`}
                  className={`w-20 h-20 object-cover transition-transform duration-200 ${
                    img.uploading ? "filter blur-sm scale-105" : ""
                  }`}
                />
                {img.uploading ? (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  </div>
                ) : img.error ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
                    Failed
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // revoke local preview URL if present
                      if (img.isLocal) {
                        try {
                          URL.revokeObjectURL(img.url);
                        } catch (revErr) {}
                      }
                      setImages((s) => s.filter((it) => it.id !== img.id));
                    }}
                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow"
                    title="Remove"
                  >
                    <svg
                      className="w-4 h-4 text-gray-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className={`px-6 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition ${
              uploading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={async (e) => {
              e.preventDefault();
              // basic validation
              if (
                !name ||
                !category ||
                !location ||
                !date ||
                !time ||
                !description ||
                !phone ||
                !email
              ) {
                toast.error("Please fill required fields");
                return;
              }
              if (images.some((it) => it.uploading)) {
                toast.error("Please wait for image uploads to finish");
                return;
              }
              try {
                const payload = {
                  reportType: activeType,
                  itemName: name,
                  location,
                  // combine date + time into an ISO datetime (stored in DB)
                  reportDate:
                    date && time
                      ? new Date(`${date}T${time}`).toISOString()
                      : date || null,
                  itemStatus: activeType === "lost" ? "lost" : "found",
                  categoryName: category,
                  description,
                  contactInfo: phone,
                  contactEmail: email,
                  images: images.map((it) => it.url),
                };
                const res = await fetch("/api/reports", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data?.success) {
                  toast.success(
                    "Report submitted successfully! Redirecting..."
                  );
                  // give the user a moment to see the toast
                  setTimeout(() => (window.location.href = `/profile`), 1200);
                } else {
                  toast.error("Failed to submit report");
                }
              } catch (err) {
                console.error(err);
                toast.error("An error occurred");
              }
            }}
          >
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}
