import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { claims, users } from "@/lib/schema/index.js";
import { desc } from "drizzle-orm";
import { verifyAdminToken, extractEmailFromToken } from "@/utils/adminAuth";

async function isAdminRequest(req) {
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
    const status = url.searchParams.get("status") || "";
    let rows = await db
      .select()
      .from(claims)
      .orderBy(desc(claims.createdAt))
      .limit(200);
    if (status) rows = rows.filter((r) => String(r.claimStatus) === status);
    return NextResponse.json({ success: true, claims: rows });
  } catch (err) {
    console.error("/api/admin/claims GET error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
