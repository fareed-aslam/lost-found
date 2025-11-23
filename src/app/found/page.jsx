"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const categories = [
  "All Items",
  "Electronics",
  "Bags",
  "Jewelry",
  "Accessories",
];

export default function FoundItemsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [items, setItems] = useState([]);
  const [myClaimsMap, setMyClaimsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/reports?status=found");
        const data = await res.json();
        if (!cancelled && data.success) {
          const formatDateTime = (v) => {
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
            category: r.categoryName || "Uncategorized",
            location: r.location,
            date: formatDateTime(r.reportDate),
            description: r.description || "",
            // normalize status values coming from server
            status: (r.itemStatus || r.reportType || "available").toLowerCase(),
            image: r.images && r.images.length ? r.images[0] : null,
          }));
          setItems(mapped);
        }
      } catch (e) {
        console.error("Failed to load found items", e);
      } finally {
        if (!cancelled) setLoading(false);
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
    load();
    loadMyClaims();

    // Also check for a recent local claim (submitted from the claim form) so Verify button appears immediately
    try {
      const key = `nf_claim_${String(
        localStorage.getItem("nf_recent_claim_report") || ""
      )}`;
      // legacy: we'll also scan explicit key
      const recentRaw = localStorage.getItem("nf_recent_claim");
      if (recentRaw) {
        try {
          const parsed = JSON.parse(recentRaw);
          if (parsed && parsed.reportId) {
            setMyClaimsMap((m) => ({
              ...m,
              [String(parsed.reportId)]: parsed,
            }));
          }
        } catch (e) {}
      }
    } catch (e) {}

    // re-fetch when user returns to page (no periodic polling)
    function onVisible() {
      if (document.visibilityState === "visible") {
        load();
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

  const filteredItems = items.filter(
    (item) =>
      (activeCategory === "All Items" || item.category === activeCategory) &&
      (item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-medium text-gray-800 mb-6 font-geist-sans">
        Found Items
      </h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
        <div className="flex-1 flex items-center gap-2 animate-fade-in">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search found items..."
              className="w-full px-5 py-3 border-3 border-blue-300 bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow transition-all duration-300 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-700 text-white rounded-full p-2 shadow hover:bg-blue-800 transition duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
        <Link
          href="/report"
          className="px-4 py-2 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition animate-fade-in"
        >
          + Report Found Item
        </Link>
      </div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-lg font-geist-sans text-sm border ${
              activeCategory === cat
                ? "bg-blue-700 text-white"
                : "bg-white text-gray-700"
            } hover:bg-blue-100 transition`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl shadow p-4 flex flex-col animate-fade-in hover:-translate-y-1 transition-transform duration-200 hover:shadow-lg"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <img
                src={item.image || "/placeholder-400x300.png"}
                alt={item.title}
                className="rounded mb-4 w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  {/* Original FOUND tag (indicates report type) */}
                  <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                    FOUND
                  </span>

                  {/* Separate claim-status pill: UNCLAIMED / PENDING / CLAIMED / REJECTED */}
                  {(() => {
                    const claim = myClaimsMap[String(item.id)];
                    // If there's no claim, show UNCLAIMED
                    if (!claim) {
                      return (
                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-50 text-green-700 font-medium">
                          UNCLAIMED
                        </span>
                      );
                    }

                    const s = String(claim.claimStatus || "").toLowerCase();
                    const claimedSet = new Set([
                      "challenge_verified",
                      "accepted",
                      "released",
                      "claimed",
                    ]);
                    if (claimedSet.has(s)) {
                      return (
                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                          CLAIMED
                        </span>
                      );
                    }

                    if (s === "rejected") {
                      return (
                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                          REJECTED
                        </span>
                      );
                    }

                    // Any other claim state -> show PENDING
                    return (
                      <span className="inline-block px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        PENDING
                      </span>
                    );
                  })()}
                </div>
                <div className="font-medium text-lg text-gray-800 mb-1 font-geist-sans">
                  {item.title}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  {item.location}
                </div>
                <div className="text-xs text-gray-400 mb-2">{item.date}</div>
                <div className="text-sm text-gray-700 mb-4">
                  {item.description}
                </div>
                {/* status pill already shown above; no duplicate */}
              </div>
              <div className="mt-auto flex items-center justify-between gap-4">
                <div className="flex-shrink-0">
                  <ClaimButton item={item} myClaimsMap={myClaimsMap} />
                </div>
                {/* Show Verify button only if the current user's claim for this report
                    has been reviewed and a challenge was requested by admin. */}
                {(() => {
                  const claim = myClaimsMap[String(item.id)];
                  if (!claim) return null;
                  const status = String(claim.claimStatus || "").toLowerCase();
                  // show verify when the user has submitted a claim (pending/created/submitted)
                  // or when admin explicitly requested a challenge
                  const showVerifyStatuses = new Set([
                    "challenge_requested",
                    "pending",
                    "created",
                    "submitted",
                  ]);
                  if (showVerifyStatuses.has(status)) {
                    return (
                      <div className="flex-shrink-0">
                        <Link
                          href={`/found/claim/verify?id=${item.id}&claimId=${claim.id}`}
                          className="px-4 py-2 text-sm bg-white text-gray-700 rounded-md border hover:bg-gray-50 transition"
                        >
                          Verify
                        </Link>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaimButton({ item, myClaimsMap }) {
  const router = useRouter();
  const claimedSet = new Set([
    "challenge_verified",
    "accepted",
    "released",
    "claimed",
  ]);

  function handleClick(e) {
    e.preventDefault();
    // if report-level status indicates claimed, warn and stop
    if (String(item.status || "").toLowerCase() === "claimed") {
      toast.error("This item has already been claimed.");
      return;
    }

    // if current user already has a claimed status on this report
    const myClaim = myClaimsMap && myClaimsMap[String(item.id)];
    if (
      myClaim &&
      claimedSet.has(String(myClaim.claimStatus || "").toLowerCase())
    ) {
      toast.error("You have already claimed this item.");
      return;
    }

    // otherwise navigate to the claim form
    const url = `/found/claim?id=${item.id}&title=${encodeURIComponent(
      item.title
    )}&image=${encodeURIComponent(
      item.image || ""
    )}&location=${encodeURIComponent(
      item.location || ""
    )}&date=${encodeURIComponent(
      item.date || ""
    )}&description=${encodeURIComponent(
      item.description || ""
    )}&status=${encodeURIComponent(item.status || "")}`;
    router.push(url);
  }

  return (
    <button
      onClick={handleClick}
      className="w-44 px-6 py-2 text-sm bg-blue-50 text-blue-600 rounded-md font-medium hover:bg-blue-100 transition text-center"
      type="button"
    >
      Claim Item
    </button>
  );
}
