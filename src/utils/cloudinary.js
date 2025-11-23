// Client-side Cloudinary upload function
export async function uploadOnCloudinary(file) {
  if (!file) return null;
  const formData = new FormData();
  formData.append("file", file);

  formData.append("upload_preset", "lostfound"); // Use your unsigned preset name

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgonkq1yo/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
}
