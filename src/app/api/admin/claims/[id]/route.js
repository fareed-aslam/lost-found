import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { claims, claimAudit } from "@/lib/schema/index.js";
import { eq, desc } from "drizzle-orm";
import { verifyAdminToken, extractEmailFromToken } from "@/utils/adminAuth";
import { reports } from "@/lib/schema/reportSchema";

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

export async function POST(req, { params }) {
  try {
    const { ok, email } = await isAdminRequest(req);
    if (!ok)
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

    const body = await req.json();
    const action = body?.action;
    if (!action)
      return NextResponse.json(
        { success: false, error: "missing_action" },
        { status: 400 }
      );

    if (action === "accept") {
      await db
        .update(claims)
        .set({ claimStatus: "accepted" })
        .where(eq(claims.id, id));
      // Mark the related report as claimed so it shows as no longer available
      try {
        const crow = await db
          .select()
          .from(claims)
          .where(eq(claims.id, id))
          .limit(1);
        if (crow && crow.length) {
          const reportId = crow[0].reportId;
          if (reportId) {
            await db
              .update(reports)
              .set({ itemStatus: "claimed" })
              .where(eq(reports.id, reportId));
          }
        }
      } catch (e) {
        console.warn("failed to update report status on claim accept", e);
      }

      // generate a handover token (encoded short payload) for QR/Handover use
      const tokenPayload = `${id}:${Date.now()}:${Math.floor(
        100000 + Math.random() * 900000
      )}`;
      const handoverToken = Buffer.from(tokenPayload).toString("base64");

      // compute a SHA256 hash of the token and store only the hash in audit details
      let handoverTokenHash = null;
      try {
        const { createHash } = await import("crypto");
        handoverTokenHash = createHash("sha256")
          .update(handoverToken)
          .digest("hex");
      } catch (e) {
        console.warn("crypto hash failed", e);
        handoverTokenHash = null;
      }

      await db
        .insert(claimAudit)
        .values({
          actorUserId: null,
          claimId: id,
          action: "accept",
          details: JSON.stringify({ by: email, handoverTokenHash }),
          createdAt: new Date(),
        });
      return NextResponse.json({
        success: true,
        handover: { token: handoverToken, payload: tokenPayload },
      });
    }

    if (action === "reject") {
      const reason = body?.reason || null;
      await db
        .update(claims)
        .set({ claimStatus: "rejected" })
        .where(eq(claims.id, id));
      await db
        .insert(claimAudit)
        .values({
          actorUserId: null,
          claimId: id,
          action: "reject",
          details: JSON.stringify({ by: email, reason }),
          createdAt: new Date(),
        });
      return NextResponse.json({ success: true });
    }

    if (action === "request_challenge") {
      // generate a short numeric code and record it in audit details (no email/SMS by default)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await db
        .insert(claimAudit)
        .values({
          actorUserId: null,
          claimId: id,
          action: "request_challenge",
          details: JSON.stringify({ by: email, code }),
          createdAt: new Date(),
        });
      await db
        .update(claims)
        .set({ claimStatus: "challenge_requested" })
        .where(eq(claims.id, id));
      return NextResponse.json({ success: true, code });
    }

    if (action === "release") {
      const provided = body?.handoverToken;
      if (!provided)
        return NextResponse.json(
          { success: false, error: "missing_token" },
          { status: 400 }
        );

      // find the most recent 'accept' audit entry for this claim
      const audits = await db
        .select()
        .from(claimAudit)
        .where(eq(claimAudit.claimId, id))
        .orderBy(desc(claimAudit.createdAt))
        .limit(10);
      let acceptAudit = null;
      for (const a of audits) {
        if (String(a.action) === "accept") {
          acceptAudit = a;
          break;
        }
      }
      if (!acceptAudit)
        return NextResponse.json(
          { success: false, error: "no_accept_record" },
          { status: 400 }
        );

      // compare hashes
      let providedHash = null;
      try {
        const { createHash } = await import("crypto");
        providedHash = createHash("sha256").update(provided).digest("hex");
      } catch (e) {
        console.warn("crypto hash failed", e);
      }

      let details = {};
      try {
        details = JSON.parse(acceptAudit.details || "{}");
      } catch (e) {}
      const expectedHash = details.handoverTokenHash || null;
      if (!expectedHash || !providedHash || providedHash !== expectedHash)
        return NextResponse.json(
          { success: false, error: "invalid_token" },
          { status: 403 }
        );

      // token valid -> mark claim released and report status updated
      await db
        .update(claims)
        .set({ claimStatus: "released" })
        .where(eq(claims.id, id));
      try {
        const crow = await db
          .select()
          .from(claims)
          .where(eq(claims.id, id))
          .limit(1);
        if (crow && crow.length) {
          const reportId = crow[0].reportId;
          if (reportId) {
            await db
              .update(reports)
              .set({ itemStatus: "released" })
              .where(eq(reports.id, reportId));
          }
        }
      } catch (e) {
        console.warn("failed to update report status on release", e);
      }

      await db
        .insert(claimAudit)
        .values({
          actorUserId: null,
          claimId: id,
          action: "release",
          details: JSON.stringify({ by: email }),
          createdAt: new Date(),
        });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "unknown_action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("/api/admin/claims/[id] POST error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
