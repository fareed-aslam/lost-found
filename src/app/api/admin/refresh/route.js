import { NextResponse } from "next/server";
import { verifyAdminToken, extractEmailFromToken } from "@/utils/adminAuth";

export async function POST(req) {
  try {
    const cookiesHeader = req.headers.get("cookie") || "";
    let token = null;
    if (cookiesHeader) {
      const parts = cookiesHeader.split(";").map((p) => p.trim());
      for (const p of parts) {
        if (p.startsWith("admin_token=")) {
          token = p.slice("admin_token=".length);
          break;
        }
      }
    }
    if (!token)
      return NextResponse.json(
        { success: false, error: "no_token" },
        { status: 401 }
      );
    token = token.replace(/^"|"$/g, "");
    try {
      token = decodeURIComponent(token);
    } catch (e) {}
    const ok = await verifyAdminToken(token);
    if (!ok)
      return NextResponse.json(
        { success: false, error: "invalid_token" },
        { status: 401 }
      );
    const email = extractEmailFromToken(token) || "";
    const res = NextResponse.json({ success: true });
    // Reissue session cookie (no Max-Age) with refreshed signed token (timestamp inside token)
    res.headers.append(
      "Set-Cookie",
      `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );
    return res;
  } catch (err) {
    console.error("/api/admin/refresh error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
