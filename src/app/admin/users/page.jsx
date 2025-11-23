"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const perPage = 20;

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?limit=${perPage}&offset=${page * perPage}`
      );
      const j = await res.json();
      if (j?.success) {
        setUsers(j.users || []);
        setTotal(j.total || 0);
      } else {
        toast.error("Failed to load users");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function toggleAdmin(u) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: u.userType === "admin" ? "localUser" : "admin",
        }),
      });
      const j = await res.json();
      if (j?.success) {
        toast.success("Updated role");
        fetchUsers();
      } else toast.error("Failed");
    } catch (e) {
      console.error(e);
      toast.error("Failed");
    }
  }

  async function toggleActive(u) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deactivate: u.deletedAt && Number(u.deletedAt) !== 0 ? false : true,
        }),
      });
      const j = await res.json();
      if (j?.success) {
        toast.success("Updated");
        fetchUsers();
      } else toast.error("Failed");
    } catch (e) {
      console.error(e);
      toast.error("Failed");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 mt-24">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <p className="text-gray-600 mb-6">Manage user accounts.</p>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto bg-white rounded-2xl shadow">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3">{u.fullName}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.userType}</td>
                    <td className="p-3">
                      {u.deletedAt && Number(u.deletedAt) !== 0
                        ? "Inactive"
                        : "Active"}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => toggleAdmin(u)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded"
                      >
                        {u.userType === "admin" ? "Revoke Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        {u.deletedAt && Number(u.deletedAt) !== 0
                          ? "Reactivate"
                          : "Deactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              Showing {users.length} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 bg-gray-100 rounded"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * perPage >= total}
                className="px-3 py-1 bg-gray-100 rounded"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
