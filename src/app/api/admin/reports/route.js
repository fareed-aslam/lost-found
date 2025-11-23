import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users } from "@/lib/schema/userSchema";
import { reports } from "@/lib/schema/reportSchema";
import { eq } from "drizzle-orm";
import { verifyAdminToken, extractEmailFromToken } from "@/utils/adminAuth";
import { getServerSession } from "next-auth";
import authOptions from "../../../../utils/auth";

async function isAdmin(req) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const match = cookies.match(/(?:^|; )admin_token=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      if (await verifyAdminToken(token)) return true;
    }

    // fallback to next-auth session role check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return false;
    const u = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    return u && u.length && String(u[0].userType) === "admin";
  } catch (e) {
    console.error("isAdmin check failed", e);
    return false;
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");
    if (idParam) {
      const id = Number(idParam);
      const rows = await db.select().from(reports).where(eq(reports.id, id));
      return NextResponse.json({ success: true, reports: rows });
    }
    const rows = await db.select().from(reports);
    return NextResponse.json({ success: true, reports: rows });
  } catch (err) {
    console.error("/api/admin/reports GET error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const allowed = await isAdmin(req);
    if (!allowed)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    const body = await req.json();
    const { id, itemStatus } = body;
    if (!id)
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    await db
      .update(reports)
      .set({ itemStatus })
      .where(eq(reports.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/admin/reports PATCH error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const allowed = await isAdmin(req);
    if (!allowed)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");
    if (!idParam)
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    const id = Number(idParam);
    await db.delete(reports).where(eq(reports.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/admin/reports DELETE error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
