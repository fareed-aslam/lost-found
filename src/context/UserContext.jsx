"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { data: session } = useSession();

  const [profileImage, setProfileImage] = useState("");
  const [fullName, setFullName] = useState("");

  // Initialize from session or localStorage on mount / when session changes
  useEffect(() => {
    // Prefer client-side stored values so immediate updates survive navigation
    try {
      const storedImage = localStorage.getItem("lf_profile_image");
      const storedName = localStorage.getItem("lf_full_name");
      if (storedImage) {
        setProfileImage(storedImage);
      } else if (session?.user?.image) {
        setProfileImage(session.user.image);
      }

      if (storedName) {
        setFullName(storedName);
      } else if (session?.user?.name) {
        setFullName(session.user.name);
      }
    } catch (e) {
      // ignore (SSR safety)
      if (session?.user) {
        if (session.user.image) setProfileImage(session.user.image);
        if (session.user.name) setFullName(session.user.name);
      }
    }
    try {
      console.log("UserContext:init", {
        fromSession: session?.user,
        storedImage:
          typeof window !== "undefined"
            ? localStorage.getItem("lf_profile_image")
            : null,
        storedName:
          typeof window !== "undefined"
            ? localStorage.getItem("lf_full_name")
            : null,
      });
    } catch (e) {}
  }, [session]);

  // Persist to localStorage so UI stays consistent across navigations
  useEffect(() => {
    try {
      if (profileImage) localStorage.setItem("lf_profile_image", profileImage);
      else localStorage.removeItem("lf_profile_image");
    } catch (e) {}
  }, [profileImage]);

  useEffect(() => {
    try {
      if (fullName) localStorage.setItem("lf_full_name", fullName);
      else localStorage.removeItem("lf_full_name");
    } catch (e) {}
  }, [fullName]);

  // Listen for explicit profile update events (dispatched after successful save)
  useEffect(() => {
    function onProfileUpdated(e) {
      const detail = e?.detail || {};
      if (detail.image) setProfileImage(detail.image);
      if (detail.name) setFullName(detail.name);
      try {
        console.log("UserContext:event profile:updated", detail);
      } catch (e) {}
    }
    try {
      window.addEventListener("profile:updated", onProfileUpdated);
    } catch (e) {}
    return () => {
      try {
        window.removeEventListener("profile:updated", onProfileUpdated);
      } catch (e) {}
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ profileImage, setProfileImage, fullName, setFullName }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export default UserContext;
