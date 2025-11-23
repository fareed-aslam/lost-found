"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

async function checkAdmin() {
  try {
    const res = await fetch("/api/admin/check");
    const j = await res.json();
    return j?.isAdmin;
  } catch (e) {
    return false;
  }
}

export default function AdminIndex() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // pages for arrow navigation (order is left -> right)
  const adminPages = [
    { href: "/admin/items", label: "Items" },
    { href: "/admin/claims", label: "Claims" },
    { href: "/admin/users", label: "Users" },
  ];

  // Compute current index in adminPages (fallback to 0)
  const currentIndex = Math.max(
    0,
    adminPages.findIndex((p) => pathname && pathname.startsWith(p.href))
  );

  // keyboard navigation for left/right arrows
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname]);

  function navigate(dir) {
    if (!adminPages.length) return;
    const len = adminPages.length;
    const next = (((currentIndex + dir) % len) + len) % len; // wrap
    router.push(adminPages[next].href);
  }

  useEffect(() => {
    (async () => {
      const ok = await checkAdmin();
      setLoading(false);
      if (!ok) router.push("/admin/login");
    })();
  }, []);

  // while on admin dashboard, periodically refresh admin cookie to keep session alive
  useEffect(() => {
    let timer = null;
    let cancelled = false;
    async function refresh() {
      try {
        await fetch("/api/admin/refresh", {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {}
    }
    // Refresh every 5 minutes
    timer = setInterval(() => {
      if (!cancelled) refresh();
    }, 1000 * 60 * 5);
    // also do an initial refresh
    refresh();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 mt-24">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage items, claims and users.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/admin/items"
          className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
        >
          <h2 className="font-semibold text-lg mb-2">Items</h2>
          <p className="text-sm text-gray-600">
            View, add, edit or remove lost & found items.
          </p>
        </Link>
        <Link
          href="/admin/claims"
          className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
        >
          <h2 className="font-semibold text-lg mb-2">Claims</h2>
          <p className="text-sm text-gray-600">
            Review and manage item claims.
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
        >
          <h2 className="font-semibold text-lg mb-2">Users</h2>
          <p className="text-sm text-gray-600">
            Manage user accounts and permissions.
          </p>
        </Link>
      </div>
    </div>
  );
}
