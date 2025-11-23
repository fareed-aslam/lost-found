"use client";
import React, { useState } from "react";

export default function ClaimItemPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [additional, setAdditional] = useState("");
  const [file, setFile] = useState(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-blue-800 mb-6 underline">
        Claim Item
      </h1>
      <div className="bg-white rounded-xl shadow p-8">
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="font-bold text-lg text-gray-800 mb-4">
            Finder's Contact Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">Found By</div>
              <div className="text-base text-gray-700">Sarah Johnson</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Date Found</div>
              <div className="text-base text-gray-700">January 20, 2024</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Contact Email</div>
              <a
                href="mailto:sarah.j@email.com"
                className="text-blue-700 underline"
              >
                sarah.j@email.com
              </a>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Contact Phone</div>
              <div className="text-base text-gray-700">(555) 123-4567</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Location Found</div>
            <div className="text-base text-gray-700">
              Central Station Platform 3
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div>
            <img
              src="https://via.placeholder.com/400x300?text=400+x+300"
              alt="Item"
              className="rounded-lg w-full h-48 object-cover mb-2"
            />
            <button className="w-full bg-blue-50 text-blue-700 rounded-lg py-2 font-medium hover:bg-blue-100 transition mb-1">
              Upload Proof of Ownership
            </button>
            <div className="text-xs text-gray-500 text-center">
              Upload an image showing proof of ownership
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Your Name</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Email Address</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Phone Number</div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Describe Your Item</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 min-h-[80px]"
          />
        </div>
        <div className="mb-8">
          <div className="text-xs text-gray-500 mb-1">
            Additional Information
          </div>
          <textarea
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
            placeholder="Additional information"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 min-h-[60px]"
          />
        </div>
        <div className="flex gap-4 justify-end">
          <button className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition">
            Cancel
          </button>
          <button className="px-6 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition">
            Submit Claim
          </button>
        </div>
      </div>
    </div>
  );
}
