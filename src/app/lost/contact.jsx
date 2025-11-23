"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FiMapPin, FiCalendar, FiUser, FiCopy } from "react-icons/fi";

export default function ContactOwner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemLocation, setItemLocation] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  // If an `id` param is present, fetch report contact info from API
  const id = searchParams.get("id");
  useEffect(() => {
    let cancelled = false;
    async function loadContact() {
      if (!id) return;
      try {
        const res = await fetch(`/api/reports?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!cancelled && data.success && data.reports && data.reports.length) {
          const r = data.reports[0];
          setEmail(r.contactEmail || "");
          setPhone(r.contactInfo || "");
          setItemName(r.itemName || "");
          setItemImage(r.images && r.images.length ? r.images[0] : "");
          setItemLocation(r.location || "");
          setItemDescription(r.description || "");
          if (r.reportDate) {
            try {
              const d = new Date(r.reportDate);
              if (!Number.isNaN(d.getTime())) {
                setItemDate(
                  d.toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                );
              } else {
                setItemDate(String(r.reportDate));
              }
            } catch (e) {
              setItemDate(String(r.reportDate));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load contact info", err);
      }
    }
    loadContact();
    return () => (cancelled = true);
  }, [id]);

  // Prefer API-provided item fields; fall back to search params, then defaults
  const nameParam = searchParams.get("title");
  const imageParam = searchParams.get("image");
  const locationParam = searchParams.get("location");
  const dateParam = searchParams.get("date");
  const owner = searchParams.get("owner") || null;
  const descriptionParam = searchParams.get("description");

  const displayName = itemName || nameParam || "Unknown Item";
  const displayImage =
    itemImage ||
    imageParam ||
    "https://via.placeholder.com/400x300?text=Item+Image";
  const displayLocation = itemLocation || locationParam || "Unknown Location";
  const displayDate = itemDate || dateParam || "Unknown Date";
  const displayDescription = itemDescription || descriptionParam || "";

  const handleCopy = async (type) => {
    const value = type === "email" ? email : phone;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(""), 1500);
    } catch (err) {
      console.error("Clipboard write failed", err);
    }
  };

  return (
    <section className="px-4 py-16 mt-20 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 font-geist-sans">
        Contact About Item
      </h1>
      <p className="text-gray-600 mb-8 font-geist-sans">
        Contact the person regarding the selected item
      </p>
      <div className="bg-white rounded-xl shadow p-6 mb-8 flex items-center gap-6">
        <img
          src={displayImage}
          alt={displayName}
          className="w-40 h-32 object-cover rounded-lg border bg-gray-100"
        />
        <div>
          <div className="font-bold text-xl text-gray-800 mb-2 font-geist-sans">
            {displayName}
          </div>
          <div className="flex items-center text-gray-600 text-sm gap-2 mb-1 font-geist-sans">
            <FiMapPin className="mr-1" /> {displayLocation}
          </div>
          <div className="flex items-center text-gray-600 text-sm gap-2 mb-1 font-geist-sans">
            <FiCalendar className="mr-1" /> {displayDate}
          </div>
          {owner ? (
            <div className="flex items-center text-gray-600 text-sm gap-2 font-geist-sans">
              <FiUser className="mr-1" /> {owner}
            </div>
          ) : null}
          {displayDescription ? (
            <div className="text-sm text-gray-700 mt-2">
              {displayDescription}
            </div>
          ) : null}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="font-bold text-lg text-gray-800 mb-4 font-geist-sans">
          Contact Information
        </h2>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1 font-geist-sans">
              Email Address
            </div>
            <div className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 font-geist-sans">
              {email || "Not provided"}
            </div>
          </div>
          <button
            onClick={() => handleCopy("email")}
            className={`ml-2 px-4 py-2 rounded-lg font-geist-sans text-sm flex items-center gap-1 transition-all duration-300 ${
              copied === "email"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            <FiCopy />
            {copied === "email" ? "Copied!" : "Copy Email"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1 font-geist-sans">
              Phone Number
            </div>
            <div className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 font-geist-sans">
              {phone || "Not provided"}
            </div>
          </div>
          <button
            onClick={() => handleCopy("phone")}
            className={`ml-2 px-4 py-2 rounded-lg font-geist-sans text-sm flex items-center gap-1 transition-all duration-300 ${
              copied === "phone"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            <FiCopy />
            {copied === "phone" ? "Copied!" : "Copy Phone"}
          </button>
        </div>
      </div>
    </section>
  );
}
