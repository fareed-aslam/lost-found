"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadOnCloudinary } from "../../../../utils/cloudinary";

export default function ClaimVerifyPage() {
  const params = useSearchParams();
  const router = useRouter();
  const reportId = Number(params.get("id") || 0);
  const claimId = Number(params.get("claimId") || 0);

  const [code, setCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!claimId) {
      // missing claim id — go back
      toast.error("Missing claim id");
      setTimeout(() => router.back(), 800);
    }
  }, [claimId]);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadOnCloudinary(file);
      setImageUrl(uploaded);
      toast.success("Image uploaded");
    } catch (e) {
      console.error(e);
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit() {
    if (!code) return toast.error("Enter the challenge code");
    if (!imageUrl) return toast.error("Upload a photo showing the code");
    try {
      const res = await fetch(`/api/claims/${claimId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, imageUrl }),
      });
      const j = await res.json();
      if (j?.success) {
        toast.success("Challenge verified — claim marked as verified");
        setTimeout(() => router.push("/profile"), 900);
      } else {
        console.error(j);
        toast.error(j.error || "Verification failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Verification failed");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 mt-24">
      <h1 className="text-2xl font-bold mb-4">Verify Claim</h1>
      <p className="text-gray-600 mb-6">
        Enter the challenge code provided by the owner and upload a photo
        showing the code.
      </p>

      <div className="bg-white p-6 rounded-2xl shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Challenge Code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-3 border rounded"
            placeholder="123456"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo of code*
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`px-4 py-2 border rounded ${
                uploading ? "opacity-60" : ""
              }`}
            >
              Choose Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files && e.target.files[0])}
            />
            <div className="text-sm text-gray-500">
              {imageUrl ? "Uploaded" : "No photo"}
            </div>
          </div>
          {imageUrl && (
            <div className="mt-3 w-48 h-48 bg-gray-100 rounded overflow-hidden">
              <img src={imageUrl} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={uploading}
            className="px-4 py-2 bg-blue-700 text-white rounded"
          >
            Submit Verification
          </button>
        </div>
      </div>
    </div>
  );
}
