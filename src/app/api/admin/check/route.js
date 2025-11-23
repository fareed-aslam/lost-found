import { NextResponse } from "next/server";
import { verifyAdminToken, extractEmailFromToken } from "@/utils/adminAuth";
import { getServerSession } from "next-auth";
import authOptions from "../../../../utils/auth";
import { db } from "@/config/db";
import { users } from "@/lib/schema/userSchema";
import { eq } from "drizzle-orm";

async function checkNextAuthAdmin() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return false;
    const u = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    return u && u.length && String(u[0].userType) === "admin";
  } catch (e) {
    return false;
  }
}

export async function GET(req) {
  try {
    const cookiesHeader = req.headers.get("cookie") || "";
    // Parse cookies robustly
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

    if (token) {
      // strip possible surrounding quotes
      token = token.replace(/^"|"$/g, "");
      try {
        token = decodeURIComponent(token);
      } catch (e) {
        // ignore decode errors and use raw token
      }
      try {
        const ok = await verifyAdminToken(token);
        if (ok) {
          const email = extractEmailFromToken(token);
          return NextResponse.json({ isAdmin: true, email });
        } else {
          // log for debugging
          console.warn(
            "/api/admin/check: admin_token present but verification failed"
          );
          if (process.env.NODE_ENV !== "production") {
            return NextResponse.json({
              isAdmin: false,
              reason: "token_invalid",
            });
          }
        }
      } catch (err) {
        console.error("/api/admin/check: token verification error", err);
        if (process.env.NODE_ENV !== "production") {
          return NextResponse.json({
            isAdmin: false,
            reason: "token_error",
            details: String(err),
          });
        }
      }
    }

    // fallback to next-auth session admin check
    const nextAuthAdmin = await checkNextAuthAdmin();
    if (nextAuthAdmin) return NextResponse.json({ isAdmin: true });

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        isAdmin: false,
        reason: "no_valid_admin_cookie_or_session",
      });
    }

    return NextResponse.json({ isAdmin: false });
  } catch (err) {
    console.error("/api/admin/check error", err);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        isAdmin: false,
        reason: "internal_error",
        details: String(err),
      });
    }
    return NextResponse.json({ isAdmin: false });
  }
}
