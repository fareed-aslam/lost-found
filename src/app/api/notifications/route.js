import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { claimAudit, claims, users } from "@/lib/schema/index.js";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import authOptions from "../../../utils/auth";
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
        if (await verifyAdminToken(t))
          return { ok: true, email: extractEmailFromToken(t) };
      }
    }
  } catch (e) {}
  return { ok: false };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const sinceParam = url.searchParams.get("since");
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(0);

    // admin can see recent audits for all claims
    const adminCheck = await isAdminRequest(req);
    if (adminCheck.ok) {
      const rows = await db
        .select()
        .from(claimAudit)
        .orderBy(desc(claimAudit.createdAt))
        .limit(50);
      // filter by since
      const filtered = rows.filter((r) => new Date(r.createdAt) > sinceDate);
      return NextResponse.json({ success: true, notifications: filtered });
    }

    // claimant: fetch audits for claims owned by this user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email)
      return NextResponse.json(
        { success: false, error: "not_authenticated" },
        { status: 401 }
      );
    const urows = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    const uid = urows && urows.length ? urows[0].id : null;
    if (!uid) return NextResponse.json({ success: true, notifications: [] });

    const myClaims = await db
      .select()
      .from(claims)
      .where(eq(claims.claimantUserId, uid));
    const ids = myClaims.map((c) => c.id);
    if (!ids.length)
      return NextResponse.json({ success: true, notifications: [] });

    // fetch audits related to these claim ids and filter by since
    const audits = await db.select().from(claimAudit);
    const filtered = audits.filter(
      (a) => ids.includes(a.claimId) && new Date(a.createdAt) > sinceDate
    );
    return NextResponse.json({ success: true, notifications: filtered });
  } catch (err) {
    console.error("/api/notifications GET error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
