import { NextResponse } from "next/server";
import { signAdminToken } from "@/utils/adminAuth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password)
      return NextResponse.json(
        { success: false, error: "Missing credentials" },
        { status: 400 }
      );
    // Read admin credentials from env. If not set, allow a dev-only fallback so local testing is possible.
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      // In production we require env vars. In development provide a clear fallback for convenience.
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            success: false,
            error: "Admin credentials not configured on server",
          },
          { status: 500 }
        );
      } else {
        // Dev fallback — WARNING: change these in real deployments
        adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gmail.com";
        adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
        console.warn(
          "Admin credentials not configured; using development fallback credentials."
        );
      }
    }

    if (email === adminEmail && password === adminPassword) {
      const token = await signAdminToken(email);
      const res = NextResponse.json({ success: true });
      // set httpOnly session cookie (no Max-Age) and rely on token TTL for inactivity expiry
      res.headers.append(
        "Set-Cookie",
        `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );
      return res;
    }

    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (err) {
    console.error("/api/admin/login error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
