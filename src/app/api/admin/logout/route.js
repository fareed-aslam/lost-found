import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const res = NextResponse.json({ success: true });
    // expire cookie
    res.headers.append(
      "Set-Cookie",
      `admin_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
    );
    return res;
  } catch (err) {
    console.error("/api/admin/logout error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
