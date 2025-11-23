import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users, userAudit } from "@/lib/schema/index.js";
import { eq } from "drizzle-orm";
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

export async function GET(req, { params }) {
  try {
    const check = await isAdminRequest(req);
    if (!check.ok)
      return NextResponse.json(
        { success: false, error: "not_admin" },
        { status: 401 }
      );
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (Number.isNaN(id))
      return NextResponse.json(
        { success: false, error: "invalid_id" },
        { status: 400 }
      );
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!rows || rows.length === 0)
      return NextResponse.json(
        { success: false, error: "not_found" },
        { status: 404 }
      );
    const u = rows[0];
    return NextResponse.json({
      success: true,
      user: {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        userType: u.userType,
        deletedAt: u.deletedAt,
        profileImageUrl: u.profileImageUrl,
        phoneNumber: u.phoneNumber,
        createdAt: u.createdAt,
      },
    });
  } catch (err) {
    console.error("/api/admin/users/[id] GET error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const check = await isAdminRequest(req);
    if (!check.ok)
      return NextResponse.json(
        { success: false, error: "not_admin" },
        { status: 401 }
      );
    const actorEmail = check.email || null;
    const actorRow = actorEmail
      ? await db
          .select()
          .from(users)
          .where(eq(users.email, actorEmail))
          .limit(1)
      : null;
    const actorId = actorRow && actorRow.length ? actorRow[0].id : null;

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (Number.isNaN(id))
      return NextResponse.json(
        { success: false, error: "invalid_id" },
        { status: 400 }
      );
    const body = await req.json();
    const { userType, deactivate, fullName, phoneNumber, profileImageUrl } =
      body || {};

    const updates = {};
    if (typeof fullName !== "undefined") updates.fullName = fullName;
    if (typeof phoneNumber !== "undefined") updates.phoneNumber = phoneNumber;
    if (typeof profileImageUrl !== "undefined")
      updates.profileImageUrl = profileImageUrl;
    if (typeof userType !== "undefined") updates.userType = userType;
    if (typeof deactivate !== "undefined") {
      updates.deletedAt = deactivate ? Math.floor(Date.now() / 1000) : 0;
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json(
        { success: false, error: "no_changes" },
        { status: 400 }
      );

    await db.update(users).set(updates).where(eq(users.id, id));

    // write audit log
    try {
      const details = JSON.stringify({ changes: updates });
      await db
        .insert(userAudit)
        .values({
          actorUserId: actorId,
          targetUserId: id,
          action: "update_user",
          details,
        });
    } catch (e) {
      console.warn("Failed to write user audit log", e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/admin/users/[id] PATCH error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
