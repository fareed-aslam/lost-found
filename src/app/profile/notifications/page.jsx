"use client";
import React, { useEffect, useState } from "react";

const tabs = [
  { key: "all", label: "All Notifications" },
  { key: "unread", label: "Unread" },
  { key: "claims", label: "Claims" },
  { key: "other", label: "Other" },
];

function mapAuditToNotification(a) {
  // a: { id, claimId, action, details, createdAt }
  const action = String(a.action || "");
  let type = "other";
  if (
    action.includes("challenge") ||
    action === "accept" ||
    action === "reject" ||
    action === "verify_challenge" ||
    action === "release"
  )
    type = "claims";
  const title = `Claim ${a.claimId || "#"}`;
  let details = {};
  try {
    if (a.details) {
      if (typeof a.details === "string") details = JSON.parse(a.details);
      else details = a.details;
    }
  } catch (e) {
    // fallback: keep raw string
    details = { raw: String(a.details) };
  }

  let message = action;
  let imageUrl = null;
  if (action === "request_challenge") {
    // show who requested (by) and show code masked
    message = `Challenge requested`;
    if (details.by) message += ` by ${details.by}`;
    if (details.code)
      message += ` — code: ${String(details.code).replace(/.(?=.{2})/g, "*")}`;
  } else if (action === "verify_challenge") {
    message = `Challenge verified`;
    if (details.imageUrl) {
      imageUrl = details.imageUrl;
      message += ` — photo attached`;
    }
  } else if (action === "create_claim") {
    message = `Claim created`;
  } else if (action === "accept") {
    message = `Claim accepted`;
  } else if (action === "reject") {
    message = `Claim rejected`;
  } else if (action === "release") {
    message = `Claim released`;
  } else {
    message =
      action +
      (details && Object.keys(details).length
        ? ` — ${JSON.stringify(details).slice(0, 120)}`
        : "");
  }

  return {
    id: a.id || `${a.claimId}:${a.createdAt}`,
    type,
    title,
    message,
    createdAt: a.createdAt,
    imageUrl,
  };
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/notifications?since=${encodeURIComponent(
            "1970-01-01T00:00:00.000Z"
          )}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success && Array.isArray(data.notifications)) {
          const mapped = data.notifications
            .map(mapAuditToNotification)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          if (mounted) setNotifications(mapped);
        }
      } catch (e) {
        console.warn("failed to load notifications", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return true; // unread not tracked yet — show all
    if (activeTab === "claims") return n.type === "claims";
    return n.type === "other";
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 mt-24">
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <button
            onClick={() => setNotifications([])}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
          >
            Clear
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Recent activity related to your reports and claims
        </p>

        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {loading && <div className="text-gray-500">Loading…</div>}
          {filtered.map((n, idx) => (
            <div
              key={n.id || idx}
              className="flex items-start gap-4 bg-white rounded-lg p-4 shadow-sm border-l-4 border-transparent"
            >
              <div className="mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    n.type === "claims"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {n.type === "claims" ? "🔔" : "🔔"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-gray-800">{n.title}</div>
                    <div className="text-sm text-gray-500">{n.message}</div>
                  </div>
                  <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {n.imageUrl && (
                  <div className="mt-3">
                    <a
                      href={n.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded overflow-hidden border"
                    >
                      <img
                        src={n.imageUrl}
                        alt="notification"
                        className="w-48 h-28 object-cover"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No notifications found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
