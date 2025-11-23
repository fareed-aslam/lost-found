import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users, userAudit } from "@/lib/schema/index.js";
import { eq, or } from "drizzle-orm";
import { verifyAdminToken } from "@/utils/adminAuth";

async function isAdminRequest(req) {
  // check admin_token cookie first then fallback to other methods if needed
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const parts = cookieHeader.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith("admin_token=")) {
        let t = p.slice("admin_token=".length);
        t = t.replace(/^"|"$/g, "");
        try {
          t = decodeURIComponent(t);
        } catch (e) {}
        if (await verifyAdminToken(t)) return true;
      }
    }
  } catch (e) {}
  return false;
}

export async function GET(req) {
  try {
    const ok = await isAdminRequest(req);
    if (!ok)
      return NextResponse.json(
        { success: false, error: "not_admin" },
        { status: 401 }
      );

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 20);
    const offset = Number(url.searchParams.get("offset") || 0);
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";
    const status = url.searchParams.get("status") || "";

    let q = db.select().from(users);
    const whereClauses = [];
    if (search) {
      // basic search on name or email
      whereClauses.push(
        or(users.fullName.like(`%${search}%`), users.email.like(`%${search}%`))
      );
    }
    if (role) {
      whereClauses.push(eq(users.userType, role));
    }
    if (status === "active") {
      whereClauses.push(eq(users.deletedAt, 0));
    } else if (status === "inactive") {
      whereClauses.push(users.deletedAt.ne(0));
    }

    if (whereClauses.length) {
      // drizzle doesn't support chaining .where with array easily; just filter in JS as fallback
      const all = await db.select().from(users);
      const filtered = all.filter((u) => {
        if (search) {
          const s = search.toLowerCase();
          if (
            !(
              String(u.fullName).toLowerCase().includes(s) ||
              String(u.email).toLowerCase().includes(s)
            )
          )
            return false;
        }
        if (role && String(u.userType) !== role) return false;
        if (status === "active" && Number(u.deletedAt) !== 0) return false;
        if (status === "inactive" && Number(u.deletedAt) === 0) return false;
        return true;
      });
      const total = filtered.length;
      const page = filtered.slice(offset, offset + limit);
      const mapped = page.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        userType: u.userType,
        deletedAt: u.deletedAt,
        createdAt: u.createdAt,
      }));
      return NextResponse.json({ success: true, users: mapped, total });
    }

    const rows = await db.select().from(users).limit(limit).offset(offset);
    const mapped = rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      userType: u.userType,
      deletedAt: u.deletedAt,
      createdAt: u.createdAt,
    }));
    const countRes = await db.select().from(users);
    const total = countRes.length;
    return NextResponse.json({ success: true, users: mapped, total });
  } catch (err) {
    console.error("/api/admin/users GET error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
