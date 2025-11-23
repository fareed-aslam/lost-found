"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

async function checkAdmin() {
  try {
    const res = await fetch("/api/admin/check");
    const j = await res.json();
    return j?.isAdmin;
  } catch (e) {
    return false;
  }
}

export default function AdminClaimsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    (async () => {
      const ok = await checkAdmin();
      if (!ok) return router.push("/admin/login");
      fetchClaims();
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
  }, []);

  async function fetchClaims() {
    setLoading(true);
    try {
      // Placeholder until backend claims API is implemented
      const res = await fetch(`/api/admin/claims`);
      const j = await res.json();
      if (j?.success) setClaims(j.claims || []);
      else setClaims([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 mt-24">
      <h1 className="text-2xl font-bold mb-4">Claims Queue</h1>
      <p className="text-gray-600 mb-6">
        Review pending claims and perform verification actions.
      </p>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      ) : claims.length === 0 ? (
        <div className="text-gray-600">No claims yet.</div>
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    Claim #{c.id} — Report #{c.reportId}
                  </div>
                  <div className="font-semibold">
                    {c.claimantName || c.claimantEmail}
                  </div>
                </div>
                <div className="text-sm text-gray-500">{c.claimStatus}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/admin/claims/${c.id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "accept" }),
                      });
                      const j = await res.json();
                      if (j?.success) {
                        // if handover payload returned, copy token and show user
                        if (j.handover && j.handover.token) {
                          try {
                            await navigator.clipboard.writeText(
                              j.handover.token
                            );
                          } catch (e) {}
                          alert(
                            "Claim accepted. Handover token (copied to clipboard):\n" +
                              j.handover.token
                          );
                        } else {
                          toast.success("Claim accepted");
                        }
                        fetchClaims();
                      } else toast.error("Failed");
                    } catch (e) {
                      console.error(e);
                      toast.error("Failed");
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Accept
                </button>

                <button
                  onClick={async () => {
                    const reason =
                      prompt("Reason for rejection (optional)") || "";
                    try {
                      const res = await fetch(`/api/admin/claims/${c.id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "reject", reason }),
                      });
                      const j = await res.json();
                      if (j?.success) {
                        toast.success("Claim rejected");
                        fetchClaims();
                      } else toast.error("Failed");
                    } catch (e) {
                      console.error(e);
                      toast.error("Failed");
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Reject
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/admin/claims/${c.id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "request_challenge" }),
                      });
                      const j = await res.json();
                      if (j?.success) {
                        alert("Challenge code: " + j.code);
                        fetchClaims();
                      } else toast.error("Failed");
                    } catch (e) {
                      console.error(e);
                      toast.error("Failed");
                    }
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                >
                  Request Challenge
                </button>

                <button
                  onClick={async () => {
                    try {
                      const token = prompt(
                        "Paste the handover token (from claimant QR) to mark released"
                      );
                      if (!token) return;
                      const res = await fetch(`/api/admin/claims/${c.id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "release",
                          handoverToken: token,
                        }),
                      });
                      const j = await res.json();
                      if (j?.success) {
                        toast.success("Claim marked released");
                        fetchClaims();
                      } else
                        toast.error(
                          "Failed to release: " + (j?.error || "unknown")
                        );
                    } catch (e) {
                      console.error(e);
                      toast.error("Failed");
                    }
                  }}
                  className="px-3 py-1 bg-sky-600 text-white rounded"
                >
                  Mark Released
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
