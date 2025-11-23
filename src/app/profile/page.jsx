"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [myClaimsMap, setMyClaimsMap] = useState({});

  useEffect(() => {
    if (session?.user?.email) {
      axios
        .get(`/api/profile?email=${session.user.email}`)
        .then((res) => setUser(res.data))
        .catch(() => setUser(null));
      // Optionally fetch reported items here if you have an endpoint
      // axios.get(`/api/items?email=${session.user.email}`)
      //   .then(res => setItems(res.data))
      //   .catch(() => setItems([]));
      // load current user's claims so profile items can reflect claim status
      (async function loadMyClaims() {
        try {
          const res = await fetch("/api/claims?mine=1", {
            credentials: "include",
          });
          if (!res.ok) return;
          const j = await res.json();
          if (j && j.success && Array.isArray(j.claims)) {
            const map = {};
            for (const c of j.claims) {
              if (c.reportId) map[String(c.reportId)] = c;
            }
            setMyClaimsMap(map);
          }
        } catch (e) {
          console.warn("failed to load my claims", e);
        }
      })();
    }
  }, [session]);

  // Fetch all reported items (global) and show them in the profile's reported-items panel
  useEffect(() => {
    let cancelled = false;
    async function loadItems() {
      setLoadingItems(true);
      try {
        const res = await axios.get(`/api/reports`);
        const data = res.data;
        if (cancelled) return;
        if (data && data.success && Array.isArray(data.reports)) {
          const fmt = (v) => {
            if (!v) return "";
            const d = new Date(v);
            if (Number.isNaN(d.getTime())) return v;
            return d.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          };
          const mapped = data.reports.map((r) => ({
            id: r.id,
            title: r.itemName,
            image:
              r.images && r.images.length
                ? r.images[0]
                : "/placeholder-400x300.png",
            location: r.location,
            date: fmt(r.reportDate),
            // preserve both reportType (Found/Lost) and itemStatus (available/pending/claimed/etc.)
            reportType: (r.reportType || "").toString(),
            itemStatus: (r.itemStatus || "").toString(),
            category: r.categoryName || "Uncategorized",
            state: "Active",
          }));
          setItems(mapped);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Failed to load profile items", err);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    }

    async function loadMyClaims() {
      try {
        const res = await fetch("/api/claims?mine=1", {
          credentials: "include",
        });
        if (!res.ok) return;
        const j = await res.json();
        if (j && j.success && Array.isArray(j.claims)) {
          const map = {};
          for (const c of j.claims) {
            if (c.reportId) map[String(c.reportId)] = c;
          }
          setMyClaimsMap(map);
        }
      } catch (e) {
        console.warn("failed to load my claims", e);
      }
    }

    // initial load
    loadItems();
    loadMyClaims();

    // also re-fetch when the window regains focus so profile reflects DB changes
    function onVisible() {
      if (document.visibilityState === "visible") {
        loadItems();
        loadMyClaims();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  if (!user) return <div>Loading...</div>;

  const displayedReported =
    typeof user.reported === "number" ? user.reported : items.length;
  const displayedFound =
    typeof user.found === "number"
      ? user.found
      : items.filter((i) => String(i.reportType).toLowerCase() === "found")
          .length;

  // Group items by category for category-wise display
  const groups = items.reduce((acc, it) => {
    const k = it.category || "Uncategorized";
    if (!acc[k]) acc[k] = [];
    acc[k].push(it);
    return acc;
  }, {});

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto px-4 py-12 mt-32 justify-center items-start animate-slide-up">
      {/* Sidebar */}
      <div className="bg-gradient-to-b from-white/80 to-gray-50 rounded-xl shadow-lg p-8 w-full md:w-80 flex flex-col items-center transform transition-all duration-200 hover:shadow-2xl md:sticky md:top-24 md:self-start md:h-fit md:z-10">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full mb-4 ring-2 ring-blue-50 hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
            {user.fullName?.[0] || "U"}
          </div>
        )}
        <div className="text-lg font-bold text-gray-800 mb-1">
          {user.fullName}
        </div>
        <div className="text-gray-500 mb-6">{user.email}</div>
        <div className="flex gap-6 mb-6">
          <div className="text-center">
            <div className="text-blue-700 font-bold text-lg">
              {displayedReported || 0}
            </div>
            <div className="text-xs text-gray-500">Reported</div>
          </div>
          <div className="text-center">
            <div className="text-blue-700 font-bold text-lg">
              {displayedFound || 0}
            </div>
            <div className="text-xs text-gray-500">Found</div>
          </div>
          <div className="text-center">
            <div className="text-blue-700 font-bold text-lg">
              {user.matches || 0}
            </div>
            <div className="text-xs text-gray-500">Matches</div>
          </div>
        </div>
        <a
          href="/profile"
          className="w-full block py-2 rounded-lg bg-blue-600 text-white font-medium mb-2 text-center shadow-sm hover:brightness-105 transition"
        >
          Reported Items
        </a>
        <a
          href="/profile/notifications"
          className="w-full block py-2 rounded-lg bg-white text-gray-700 font-medium mb-2 text-center border border-gray-100 hover:shadow-sm transition"
        >
          Notifications
        </a>
        <a
          href="/profile/settings"
          className="w-full block py-2 rounded-lg bg-white text-gray-700 font-medium text-center border border-gray-100 hover:shadow-sm transition"
        >
          Settings
        </a>
      </div>
      {/* Main Content */}
      <div className="flex-1 bg-white/90 rounded-xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Your Reported Items
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Recent items you reported — quick access to contact or view.
            </p>
          </div>
          <div>
            <a
              href="/report"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:brightness-105 transition"
            >
              New Report
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {/* Professional list view with pagination */}
          {loadingItems ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white border rounded-lg p-4 shadow-sm animate-pulse"
                >
                  <div className="w-24 h-20 bg-gray-200 rounded-md shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="w-20">
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <ReportListWithPagination
              items={items}
              pageSize={6}
              claimMap={myClaimsMap}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              No reported items found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Small presentational component: list view with Prev/Next pagination
function ReportListWithPagination({ items = [], pageSize = 6, claimMap = {} }) {
  const [page, setPage] = React.useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const start = page * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return (
    <div>
      <div className="space-y-4">
        {pageItems.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-white border rounded-lg p-4 shadow-sm animate-fade-in hover:-translate-y-1 transition-transform duration-200"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-24 h-20 rounded-md object-cover shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {item.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                    <div>
                      {item.location} •{" "}
                      <span className="font-medium">{item.category}</span>
                    </div>
                    {/* report status pill (Lost / Found) - fixed to the left */}
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        String(item.reportType).toLowerCase() === "lost"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.reportType || item.itemStatus}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{item.date}</div>
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    {/* claim status pill (if current user has a claim on this report) */}
                    {(() => {
                      const claim = claimMap && claimMap[String(item.id)];
                      if (!claim) return null;
                      const s = String(claim.claimStatus || "").toLowerCase();
                      const claimedSet = new Set([
                        "challenge_verified",
                        "accepted",
                        "released",
                        "claimed",
                      ]);
                      if (claimedSet.has(s)) {
                        return (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                            CLAIMED
                          </span>
                        );
                      }
                      if (s === "rejected") {
                        return (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                            REJECTED
                          </span>
                        );
                      }
                      return (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                          PENDING
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {item.description || ""}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`/lost/contact?id=${item.id}`}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm"
              >
                Contact
              </a>
              {/* View should go to the proper app path depending on status */}
              {String(item.reportType).toLowerCase() === "found" ? (
                <a
                  href={`/found/claim?id=${item.id}`}
                  className="px-3 py-2 bg-gray-50 text-gray-700 rounded-md text-sm"
                >
                  View
                </a>
              ) : (
                <a
                  href={`/lost/contact?id=${item.id}`}
                  className="px-3 py-2 bg-gray-50 text-gray-700 rounded-md text-sm"
                >
                  View
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {start + 1}–{Math.min(start + pageSize, items.length)} of{" "}
          {items.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page <= 0}
            className={`px-3 py-1 rounded-md text-sm ${
              page <= 0
                ? "bg-gray-100 text-gray-400"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            Prev
          </button>
          <div className="text-sm text-gray-700">
            Page {page + 1} of {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={`px-3 py-1 rounded-md text-sm ${
              page >= totalPages - 1
                ? "bg-gray-100 text-gray-400"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
