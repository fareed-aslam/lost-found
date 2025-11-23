import { NextResponse } from "next/server";
import { db } from "@/config/db";
import {
  claims,
  claimEvidence,
  claimAudit,
  users,
  reports,
} from "@/lib/schema/index.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getServerSession } from "next-auth";
import authOptions from "../../../utils/auth";

function getInsertId(res) {
  if (!res) return null;
  if (typeof res.insertId === "number") return res.insertId;
  if (Array.isArray(res) && res.length && typeof res[0].insertId === "number")
    return res[0].insertId;
  if (res && typeof res[0] === "object" && typeof res[0].insertId === "number")
    return res[0].insertId;
  return null;
}

// Simple in-memory rate limiter for development. Use Redis for production.
const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 60; // 1 hour
const RATE_LIMIT_MAX = 10; // max claims per user per window

const createClaimSchema = z.object({
  reportId: z.number(),
  itemDescription: z.string().min(5),
  lostDate: z.string().optional(),
  lostPlace: z.string().optional(),
  studentId: z.string().optional(),
  evidenceUrls: z.array(z.string().url()).min(1),
});

function computeTrustScore({ evidenceCount = 0, accountCreatedAt = null }) {
  let score = 40;
  if (evidenceCount >= 1) score += 30;
  if (evidenceCount >= 3) score += 10;
  if (accountCreatedAt) {
    const ageMs = Date.now() - new Date(accountCreatedAt).getTime();
    const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    if (days > 365) score += 10;
    else if (days > 30) score += 5;
  }
  return Math.min(100, score);
}

async function isAdminSession(session) {
  if (!session || !session.user?.email) return false;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  return rows && rows.length && String(rows[0].userType) === "admin";
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email)
      return NextResponse.json(
        { success: false, error: "not_authenticated" },
        { status: 401 }
      );

    const body = await req.json();
    const parsed = createClaimSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          success: false,
          error: "invalid_payload",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    const data = parsed.data;

    // rate limit per user id (use email as fallback)
    const uid = session.user.id || session.user.email;
    const now = Date.now();
    const entry = RATE_LIMIT_MAP.get(uid) || { count: 0, windowStart: now };
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      entry.count = 0;
      entry.windowStart = now;
    }
    if (entry.count >= RATE_LIMIT_MAX)
      return NextResponse.json(
        { success: false, error: "rate_limited" },
        { status: 429 }
      );
    entry.count += 1;
    RATE_LIMIT_MAP.set(uid, entry);

    // ensure report exists
    const r = await db
      .select()
      .from(reports)
      .where(eq(reports.id, data.reportId))
      .limit(1);
    if (!r || r.length === 0)
      return NextResponse.json(
        { success: false, error: "report_not_found" },
        { status: 404 }
      );

    // prevent creating a claim if the report already has an accepted/verified claim
    try {
      const existingClaims = await db
        .select()
        .from(claims)
        .where(eq(claims.reportId, data.reportId));
      const claimedSet = new Set([
        "challenge_verified",
        "accepted",
        "claimed",
        "released",
      ]);
      if (existingClaims && existingClaims.length) {
        for (const ex of existingClaims) {
          if (claimedSet.has(String(ex.claimStatus || "").toLowerCase())) {
            return NextResponse.json(
              {
                success: false,
                error: "already_claimed",
                message: "This item is already claimed.",
              },
              { status: 409 }
            );
          }
        }
      }
    } catch (e) {
      console.warn("failed to check existing claims", e);
    }

    // look up claimant user
    const urows = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    const claimantUserId = urows && urows.length ? urows[0].id : null;
    const claimantName = session.user.name || session.user.email;

    const trustScore = computeTrustScore({
      evidenceCount: data.evidenceUrls.length,
      accountCreatedAt: urows && urows.length ? urows[0].createdAt : null,
    });

    // Insert claim using known columns from schema
    const insertRes = await db.insert(claims).values({
      reportId: data.reportId,
      claimantUserId: claimantUserId,
      claimantName,
      itemDescription: data.itemDescription,
      claimStatus: "pending",
      createdAt: new Date(),
    });

    const newId = getInsertId(insertRes);
    if (!newId) throw new Error("failed_to_insert_claim");

    // insert evidence rows
    for (const url of data.evidenceUrls) {
      await db
        .insert(claimEvidence)
        .values({ claimId: newId, url, kind: "photo", createdAt: new Date() });
    }

    // audit log
    try {
      await db.insert(claimAudit).values({
        actorUserId: claimantUserId,
        claimId: newId,
        action: "create_claim",
        details: JSON.stringify({ reportId: data.reportId }),
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("failed to write claim audit", e);
    }

    // mark the related report as pending so it appears as claimed/pending in lists
    try {
      await db
        .update(reports)
        .set({ itemStatus: "pending" })
        .where(eq(reports.id, data.reportId));
    } catch (e) {
      console.warn("failed to update report status to pending", e);
    }

    return NextResponse.json({ success: true, id: newId });
  } catch (err) {
    console.error("/api/claims POST error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine");
    const reportId = url.searchParams.get("reportId");

    const session = await getServerSession(authOptions);

    if (mine) {
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
      const rows = await db
        .select()
        .from(claims)
        .where(eq(claims.claimantUserId, uid));
      return NextResponse.json({ success: true, claims: rows });
    }

    if (reportId) {
      // only allow admins to list claims for arbitrary report
      const ok = await isAdminSession(session);
      if (!ok)
        return NextResponse.json(
          { success: false, error: "not_authorized" },
          { status: 403 }
        );
      const rows = await db
        .select()
        .from(claims)
        .where(eq(claims.reportId, Number(reportId)));
      return NextResponse.json({ success: true, claims: rows });
    }

    return NextResponse.json(
      { success: false, error: "missing_params" },
      { status: 400 }
    );
  } catch (err) {
    console.error("/api/claims GET error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
