"use client";

import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { uploadOnCloudinary } from "../../../utils/cloudinary";
import { useUser } from "@/context/UserContext";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [activeTab] = useState("profile");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { setProfileImage, setFullName: setCtxFullName } = useUser();

  // Fetch user data from DB on mount
  useEffect(() => {
    if (session?.user?.email) {
      axios
        .get(`/api/profile?email=${session.user.email}`)
        .then((res) => {
          setProfileImageUrl(res.data.profileImageUrl || "");
          setFullName(res.data.fullName || "");
          setEmail(res.data.email || "");
          setPhone(res.data.phoneNumber || "");
        })
        .catch(() => {
          setProfileImageUrl("");
          setFullName("");
          setEmail("");
          setPhone("");
        });
    }
  }, [session]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Upload to Cloudinary
    const url = await uploadOnCloudinary(file);
    console.log("Cloudinary uploaded image URL:", url);
    setProfileImageUrl(url); // Only update state, not DB or session yet
    // update shared context so navbar updates immediately even before save
    try {
      setProfileImage(url);
    } catch (e) {}
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto px-4 py-12 mt-24">
      {/* Sidebar */}
      <div className="bg-white rounded-xl shadow p-6 w-full md:w-64 flex flex-col">
        <div className="w-full py-2 rounded-lg font-medium mb-2 text-center bg-blue-600 text-white">
          Profile
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl shadow p-8">
        <Toaster richColors position="top-center" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Settings</h2>
        <p className="text-gray-600 mb-6">
          Manage your account preferences and settings
        </p>
        {activeTab === "profile" && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {fullName?.[0] || "U"}
                </div>
              )}
              <label className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium border cursor-pointer">
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            <form
              className="space-y-4 max-w-lg"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  console.log("PATCH payload:", {
                    email,
                    fullName,
                    phone,
                    profileImageUrl,
                  });
                  const patchRes = await axios.patch("/api/profile", {
                    email,
                    fullName,
                    phone,
                    profileImageUrl,
                  });
                  console.log("PATCH response:", patchRes.data);
                  // Update local session so navbar/profile icon updates immediately
                  try {
                    await update({
                      ...session,
                      user: {
                        ...session.user,
                        image: profileImageUrl,
                        name: fullName,
                        email,
                      },
                    });
                  } catch (e) {
                    // fallback: refetch session
                    await update();
                  }
                  setProfileImageUrl(profileImageUrl); // Ensure local state is updated
                  try {
                    setProfileImage(profileImageUrl);
                    setCtxFullName(fullName);
                  } catch (e) {}
                  // Dispatch event so any listeners (UserProvider) update reliably
                  try {
                    window.dispatchEvent(
                      new CustomEvent("profile:updated", {
                        detail: { name: fullName, image: profileImageUrl },
                      })
                    );
                  } catch (e) {}
                  try {
                    // ensure localStorage is populated immediately for other components
                    try {
                      localStorage.setItem("lf_full_name", fullName);
                      localStorage.setItem("lf_profile_image", profileImageUrl);
                    } catch (e) {}
                  } catch (e) {}
                  try {
                    router.refresh();
                  } catch (e) {}
                  console.log("Session after update (local):", {
                    ...session,
                    user: { ...session.user, image: profileImageUrl },
                  });
                  toast.success("Profile updated successfully!");
                } catch (err) {
                  console.error("PATCH error:", err);
                  toast.error("Failed to update profile.");
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium mt-4"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}
        {/* Only Profile tab available */}
      </div>
    </div>
  );
}
