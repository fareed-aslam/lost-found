import { NextResponse } from "next/server";
import { db } from "../../../config/db";
import { users } from "../../../lib/schema/userSchema";
import { reports } from "../../../lib/schema/reportSchema";
import { claims } from "../../../lib/schema/reportSchema";
import { eq } from "drizzle-orm";

// GET user profile by email

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const u = user[0];

    // Provide global counts: total reported items and found items
    try {
      const allReports = await db.select().from(reports);
      const reportedCount = Array.isArray(allReports) ? allReports.length : 0;

      const foundReports = (Array.isArray(allReports) ? allReports : []).filter(
        (r) => String(r.itemStatus).toLowerCase() === "found"
      );
      const foundCount = foundReports.length;

      // Count claims by this user that were accepted or verified as matches
      let matchesCount = 0;
      try {
        const userClaims = await db
          .select()
          .from(claims)
          .where(eq(claims.claimantUserId, u.id));
        if (Array.isArray(userClaims) && userClaims.length) {
          matchesCount = userClaims.filter(
            (c) =>
              String(c.claimStatus) === "accepted" ||
              String(c.claimStatus) === "challenge_verified"
          ).length;
        }
      } catch (e) {
        console.warn("failed to compute matches count", e);
        matchesCount = 0;
      }

      return NextResponse.json({
        ...u,
        reported: reportedCount,
        found: foundCount,
        matches: matchesCount,
      });
    } catch (err) {
      console.error("Failed to compute counts for profile", err);
      return NextResponse.json({ ...u, reported: 0, found: 0, matches: 0 });
    }
  } catch (error) {
    console.error("API /profile GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH user profile image

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { email, profileImageUrl, fullName, phone } = body;
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    // Build update object
    const updateObj = {};
    if (profileImageUrl) updateObj.profileImageUrl = profileImageUrl;
    if (fullName) updateObj.fullName = fullName;
    if (phone) updateObj.phoneNumber = phone;
    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    await db.update(users).set(updateObj).where(eq(users.email, email));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /profile PATCH error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
