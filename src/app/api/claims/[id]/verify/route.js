import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { claimAudit, claims } from "@/lib/schema/index.js";
import { eq } from "drizzle-orm";

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (Number.isNaN(id))
      return NextResponse.json(
        { success: false, error: "invalid_id" },
        { status: 400 }
      );

    const body = await req.json();
    const { code, imageUrl } = body || {};
    if (!code || !imageUrl)
      return NextResponse.json(
        { success: false, error: "missing_fields" },
        { status: 400 }
      );

    // find latest challenge request audit for this claim
    const audits = await db
      .select()
      .from(claimAudit)
      .where(eq(claimAudit.claimId, id));
    const challenges = audits
      .filter((a) => a.action === "request_challenge")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!challenges || challenges.length === 0)
      return NextResponse.json(
        { success: false, error: "no_challenge" },
        { status: 400 }
      );
    const last = challenges[0];
    let details = {};
    try {
      details = JSON.parse(last.details || "{}");
    } catch (e) {}
    if (!details.code || String(details.code) !== String(code))
      return NextResponse.json(
        { success: false, error: "invalid_code" },
        { status: 400 }
      );

    // mark claim as verified
    await db
      .update(claims)
      .set({ claimStatus: "challenge_verified" })
      .where(eq(claims.id, id));
    await db.insert(claimAudit).values({
      actorUserId: null,
      claimId: id,
      action: "verify_challenge",
      details: JSON.stringify({ imageUrl }),
      createdAt: new Date(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/claims/[id]/verify POST error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
