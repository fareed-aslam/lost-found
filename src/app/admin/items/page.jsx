"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadOnCloudinary } from "../../../utils/cloudinary";

export default function AdminItemsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    reportType: "lost",
    itemName: "",
    categoryName: "",
    location: "",
    date: "",
    time: "",
    description: "",
    contactInfo: "",
    contactEmail: "",
    imageFile: null,
  });
  const [categories, setCategories] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/check");
        const j = await res.json();
        if (!j?.isAdmin) return router.push("/admin/login");
      } catch (e) {
        router.push("/admin/login");
        return;
      }
      fetchReports();
      // fetch categories for dropdown
      (async () => {
        try {
          const c = await fetch("/api/categories");
          const jc = await c.json();
          if (jc?.success && Array.isArray(jc.categories))
            setCategories(jc.categories);
        } catch (e) {
          // ignore
        }
      })();
    })();
    // refresh admin cookie while on this page
    let cancelled = false;
    const iv = setInterval(() => {
      if (cancelled) return;
      try {
        fetch("/api/admin/refresh", { method: "POST", credentials: "include" });
      } catch (e) {}
    }, 1000 * 60 * 5);
    (async () => {
      try {
        await fetch("/api/admin/refresh", {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {}
    })();
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [session]);

  async function handleAddSubmit(e) {
    e.preventDefault();
    setAdding(true);
    try {
      let imageUrl = null;
      if (newItem.imageFile) {
        imageUrl = await uploadOnCloudinary(newItem.imageFile);
      }

      const payload = {
        reportType: newItem.reportType,
        itemName: newItem.itemName,
        location: newItem.location,
        reportDate:
          newItem.date && newItem.time
            ? new Date(`${newItem.date}T${newItem.time}`).toISOString()
            : newItem.date || null,
        itemStatus: newItem.reportType === "lost" ? "lost" : "found",
        categoryName: newItem.categoryName,
        description: newItem.description,
        contactInfo: newItem.contactInfo,
        contactEmail: newItem.contactEmail,
        images: imageUrl ? [imageUrl] : [],
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j?.success) {
        toast.success("Item added");
        setShowAddModal(false);
        setNewItem({
          reportType: "lost",
          itemName: "",
          categoryName: "",
          location: "",
          date: "",
          time: "",
          description: "",
          contactInfo: "",
          contactEmail: "",
          imageFile: null,
        });
        fetchReports();
      } else {
        console.error("Add item failed", j);
        toast.error(j?.error || "Failed to add item");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports`);
      const json = await res.json();
      if (json?.success) setReports(json.reports || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`/api/admin/reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, itemStatus: status }),
      });
      const j = await res.json();
      if (j?.success) {
        toast.success("Updated");
        fetchReports();
      } else toast.error("Failed to update");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    }
  }

  async function removeReport(id) {
    if (!confirm("Delete this report permanently?")) return;
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, {
        method: "DELETE",
      });
      const j = await res.json();
      if (j?.success) {
        toast.success("Deleted");
        setReports((s) => s.filter((r) => r.id !== id));
      } else toast.error("Delete failed");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 mt-24">
      <h1 className="text-2xl font-bold mb-4">Manage Items</h1>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-600">
          Review lost & found items, change status or remove.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
        >
          + Add Item
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start gap-4">
                <img
                  src={r.images?.[0] || "/placeholder.png"}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{r.itemName}</h3>
                  <p className="text-sm text-gray-600">
                    {r.categoryName || "—"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{r.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        updateStatus(
                          r.id,
                          r.itemStatus === "found" ? "lost" : "found"
                        )
                      }
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Toggle Lost/Found
                    </button>
                    <button
                      onClick={() => removeReport(r.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[720px] max-w-full bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Add Lost/Found Item</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="flex gap-3">
                <select
                  value={newItem.reportType}
                  onChange={(e) =>
                    setNewItem((s) => ({ ...s, reportType: e.target.value }))
                  }
                  className="px-3 py-2 border rounded"
                >
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
                <input
                  required
                  value={newItem.itemName}
                  onChange={(e) =>
                    setNewItem((s) => ({ ...s, itemName: e.target.value }))
                  }
                  placeholder="Item name"
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  {categories.length > 0 ? (
                    <select
                      value={
                        categories.find((c) => c.name === newItem.categoryName)
                          ? newItem.categoryName
                          : newItem.categoryName
                          ? "other"
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "other")
                          setNewItem((s) => ({ ...s, categoryName: "" }));
                        else setNewItem((s) => ({ ...s, categoryName: v }));
                      }}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="other">Other (type below)</option>
                    </select>
                  ) : (
                    <input
                      value={newItem.categoryName}
                      onChange={(e) =>
                        setNewItem((s) => ({
                          ...s,
                          categoryName: e.target.value,
                        }))
                      }
                      placeholder="Category"
                      className="w-full px-3 py-2 border rounded"
                    />
                  )}
                  {/* show text input when user picked Other or categories not loaded */}
                  {(categories.length === 0 ||
                    (categories.length > 0 &&
                      !categories.find(
                        (c) => c.name === newItem.categoryName
                      ))) && (
                    <input
                      value={newItem.categoryName}
                      onChange={(e) =>
                        setNewItem((s) => ({
                          ...s,
                          categoryName: e.target.value,
                        }))
                      }
                      placeholder="Type category name"
                      className="mt-2 w-full px-3 py-2 border rounded"
                    />
                  )}
                </div>
                <input
                  value={newItem.location}
                  onChange={(e) =>
                    setNewItem((s) => ({ ...s, location: e.target.value }))
                  }
                  placeholder="Location"
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={newItem.date}
                  onChange={(e) =>
                    setNewItem((s) => ({ ...s, date: e.target.value }))
                  }
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="time"
                  value={newItem.time}
                  onChange={(e) =>
                    setNewItem((s) => ({ ...s, time: e.target.value }))
                  }
                  className="px-3 py-2 border rounded"
                />
                <input
                  value={newItem.contactInfo}
                  onChange={(e) =>
                    setNewItem((s) => ({ ...s, contactInfo: e.target.value }))
                  }
                  placeholder="Contact phone"
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
              <div>
                <textarea
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Description"
                  className="w-full px-3 py-2 border rounded min-h-[80px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setNewItem((s) => ({ ...s, imageFile: f }));
                    if (f) {
                      try {
                        const url = URL.createObjectURL(f);
                        setPreviewUrl(url);
                      } catch (e) {}
                    } else {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-dashed rounded bg-gray-50 hover:bg-gray-100"
                >
                  Choose Image
                </button>
                {previewUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={previewUrl}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewItem((s) => ({ ...s, imageFile: null }));
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }
                      }}
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                      setShowAddModal(false);
                    }}
                    className="px-4 py-2 bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    {adding ? "Adding..." : "Add Item"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
