"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadOnCloudinary } from "../../../utils/cloudinary";

export default function ClaimFormPage() {
  const params = useSearchParams();
  const router = useRouter();
  const reportId = Number(params.get("id") || 0);
  const title = params.get("title") || "";
  const image = params.get("image") || "";

  const [description, setDescription] = useState("");
  const [studentId, setStudentId] = useState("");
  const [images, setImages] = useState([]); // { id, url, uploading, error }
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    // if not logged in, redirect to login
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const j = await res.json();
        if (!j || !j.user) {
          toast.error("You must be logged in to claim an item");
          setTimeout(() => router.push("/auth/login"), 800);
        }
      } catch (e) {}
    })();
  }, []);

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(f);
      setImages((s) => [
        ...s,
        { id, url: preview, uploading: true, isLocal: true },
      ]);
      try {
        const uploaded = await uploadOnCloudinary(f);
        setImages((s) =>
          s.map((it) =>
            it.id === id
              ? {
                  ...it,
                  url: uploaded || it.url,
                  uploading: false,
                  isLocal: false,
                }
              : it
          )
        );
        try {
          URL.revokeObjectURL(preview);
        } catch (_) {}
      } catch (err) {
        console.error("upload failed", err);
        setImages((s) =>
          s.map((it) =>
            it.id === id ? { ...it, uploading: false, error: true } : it
          )
        );
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 mt-24">
      <h1 className="text-2xl font-bold mb-2">Claim Item</h1>
      <p className="text-gray-600 mb-6">
        Claiming: <strong>{title}</strong>
      </p>

      <div className="bg-white p-6 rounded-2xl shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description*
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded"
            rows={4}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student ID*
          </label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full p-3 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos (at least one)*
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`px-4 py-2 border rounded ${
                uploading ? "opacity-60" : ""
              }`}
            >
              Choose Photos
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="text-sm text-gray-500">
              {images.length ? `${images.length} selected` : "No images"}
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative w-24 h-24 rounded overflow-hidden bg-gray-100"
              >
                <img
                  src={img.url}
                  className={`w-24 h-24 object-cover ${
                    img.uploading ? "filter blur-sm" : ""
                  }`}
                />
                {!img.uploading && !img.error && (
                  <button
                    onClick={() =>
                      setImages((s) => s.filter((it) => it.id !== img.id))
                    }
                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow"
                  >
                    ×
                  </button>
                )}
                {img.uploading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                    Uploading
                  </div>
                )}
                {img.error && (
                  <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center text-white text-xs">
                    Error
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={async () => {
              if (!description || !studentId)
                return toast.error("Please fill required fields");
              if (images.length === 0 || images.some((it) => it.uploading))
                return toast.error("Please upload at least one photo");
              try {
                const payload = {
                  reportId,
                  itemDescription: description,
                  studentId,
                  evidenceUrls: images.map((it) => it.url),
                };
                const res = await fetch("/api/claims", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const j = await res.json();
                if (j?.success) {
                  toast.success(
                    "Claim submitted — owner will review. Redirecting to verification..."
                  );
                  // If we have the new claim id, redirect claimant to the verify page
                  const claimId = j.id || j?.id;
                  // store a lightweight local flag so the Found page can show Verify immediately
                  try {
                    const val = JSON.stringify({
                      id: claimId,
                      claimStatus: "pending",
                      reportId,
                    });
                    localStorage.setItem("nf_recent_claim", val);
                  } catch (e) {}
                  setTimeout(() => {
                    if (claimId)
                      router.push(
                        `/found/claim/verify?id=${reportId}&claimId=${claimId}`
                      );
                    else router.push("/profile");
                  }, 900);
                } else {
                  console.error("claim failed", j);
                  toast.error(j.error || "Failed to submit claim");
                }
              } catch (e) {
                console.error(e);
                toast.error("Failed to submit claim");
              }
            }}
            className="px-4 py-2 bg-blue-700 text-white rounded"
          >
            Submit Claim
          </button>
        </div>
      </div>
    </div>
  );
}
