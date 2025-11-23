"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (j?.success) {
        toast.success("Signed in as admin");
        // Poll /api/admin/check to confirm the admin cookie is active before navigating
        const maxRetries = 8;
        let ok = false;
        for (let i = 0; i < maxRetries; i++) {
          try {
            // small delay between attempts
            await new Promise((r) => setTimeout(r, 150 * (i + 1)));
            const checkRes = await fetch("/api/admin/check", {
              credentials: "include",
            });
            const checkJson = await checkRes.json();
            console.log("admin/check", checkJson);
            if (checkJson?.isAdmin) {
              ok = true;
              break;
            }
          } catch (e) {
            // ignore and retry
          }
        }
        if (ok) {
          // Use a full page navigation so the server receives the admin cookie
          // and renders admin server-side content immediately.
          window.location.href = "/admin";
        } else
          toast.error(
            "Signed in but server did not acknowledge admin session. Try refreshing."
          );
      } else {
        toast.error(j.error || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-blue-100 via-white to-blue-200 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-bold mb-2">Admin Sign In</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter admin credentials to access the dashboard.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="password"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              disabled={loading}
              className="px-4 py-2 bg-blue-700 text-white rounded"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail(
                  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gmail.com"
                );
                setPassword("");
              }}
              className="text-sm text-gray-500"
            >
              Use ENV email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
