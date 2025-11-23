"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function safeParseDetails(d) {
  if (!d) return null;
  if (typeof d === "object") return d;
  try {
    return JSON.parse(d);
  } catch (e) {
    return String(d);
  }
}

function maskCode(code) {
  if (!code) return "";
  const s = String(code).trim();
  if (s.length <= 2) return "••";
  return "••" + s.slice(-2);
}

export default function NotificationsPoller({ intervalMs = 20000 }) {
  const lastSeenRef = useRef(localStorage.getItem("nf_last_seen") || null);
  const [running, setRunning] = useState(true);
  const shownRef = useRef(null);

  if (shownRef.current == null) {
    try {
      const raw = localStorage.getItem("nf_shown_ids") || "[]";
      const arr = JSON.parse(raw);
      shownRef.current = new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      shownRef.current = new Set();
    }
  }

  useEffect(() => {
    let mounted = true;
    // shownRef initialized at component scope

    async function poll() {
      try {
        const since = lastSeenRef.current || new Date(0).toISOString();
        const res = await fetch(
          `/api/notifications?since=${encodeURIComponent(since)}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (
          data &&
          data.success &&
          Array.isArray(data.notifications) &&
          data.notifications.length
        ) {
          // sort ascending by createdAt so we toast oldest first
          const notifications = data.notifications.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          for (const n of notifications) {
            try {
              // Avoid duplicate toasts for the same audit id
              const nid = n.id || `${n.claimId}-${n.action}-${n.createdAt}`;
              if (shownRef && shownRef.current && shownRef.current.has(nid)) {
                lastSeenRef.current = new Date(n.createdAt).toISOString();
                localStorage.setItem("nf_last_seen", lastSeenRef.current);
                continue;
              }

              const details = safeParseDetails(n.details);
              let message = `Claim ${n.claimId}: ${String(n.action).replace(
                /_/g,
                " "
              )}`;
              let description = undefined;

              if (typeof details === "object") {
                // handle create_claim specially to avoid dumping raw JSON
                if (
                  n.action === "create_claim" ||
                  String(n.action).toLowerCase().includes("create")
                ) {
                  const rid =
                    details.reportId ||
                    details.reportld ||
                    details.report ||
                    null;
                  message = `Claim ${n.claimId}: submitted`;
                  description = rid ? (
                    <div className="text-sm">Report {String(rid)}</div>
                  ) : undefined;
                } else if (n.action === "request_challenge") {
                  // request_challenge -> show masked code
                  const by = details.by || details.admin || "admin";
                  const code = details.code || details.challenge || null;
                  description = (
                    <div>
                      <div className="text-sm">Requested by {by}</div>
                      {code ? (
                        <div className="text-sm">Code: {maskCode(code)}</div>
                      ) : null}
                    </div>
                  );
                } else if (n.action === "verify_challenge") {
                  // show thumbnail if present (support common typo keys)
                  const url =
                    details.imageUrl ||
                    details.imagelJrl ||
                    details.image ||
                    details.url;
                  description = (
                    <div className="flex items-center gap-2">
                      {url ? (
                        <img
                          src={url}
                          className="w-20 h-16 object-cover rounded"
                          alt="verify"
                        />
                      ) : null}
                      <div className="text-sm">Verification submitted</div>
                    </div>
                  );
                } else if (n.action === "accept") {
                  const by = details.by || "admin";
                  description = <div className="text-sm">Accepted by {by}</div>;
                } else if (n.action === "reject") {
                  const by = details.by || "admin";
                  const reason = details.reason || null;
                  description = (
                    <div>
                      <div className="text-sm">Rejected by {by}</div>
                      {reason ? (
                        <div className="text-sm">Reason: {String(reason)}</div>
                      ) : null}
                    </div>
                  );
                } else {
                  description = (
                    <div className="text-sm">
                      {JSON.stringify(details).slice(0, 200)}
                    </div>
                  );
                }
              } else {
                description = String(details || n.details || "");
              }

              toast(message, { description });

              // mark as shown
              if (shownRef && shownRef.current) {
                shownRef.current.add(nid);
                try {
                  localStorage.setItem(
                    "nf_shown_ids",
                    JSON.stringify(Array.from(shownRef.current).slice(-200))
                  );
                } catch (e) {}
              }

              lastSeenRef.current = new Date(n.createdAt).toISOString();
              localStorage.setItem("nf_last_seen", lastSeenRef.current);
            } catch (e) {
              console.warn("failed to process notification", e);
            }
          }
        }
      } catch (e) {
        console.warn("notifications poll failed", e);
      }
    }

    poll();
    const t = setInterval(() => {
      if (running) poll();
    }, intervalMs);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [intervalMs, running]);

  return null;
}
