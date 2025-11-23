import { db } from "@/config/db";
import { reports, reportImages, categories } from "@/lib/schema/reportSchema";
import { eq, or } from "drizzle-orm";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      reportType = "lost",
      itemName,
      location,
      reportDate,
      itemStatus,
      categoryName,
      categoryId,
      description,
      contactInfo,
      contactEmail,
      images = [],
    } = body;

    // Helper: extract numeric insert id from various driver return shapes
    const getInsertId = (res) => {
      if (res == null) return null;
      if (typeof res === "number") return res;
      if (typeof res.insertId === "number") return res.insertId;
      if (typeof res.insertId === "string") return Number(res.insertId) || null;
      // sometimes drizzle returns an array or nested result
      if (Array.isArray(res)) {
        // e.g. [insertId] or [{ insertId: 4 }]
        if (typeof res[0] === "number") return res[0];
        if (res[0] && typeof res[0].insertId === "number")
          return res[0].insertId;
      }
      return null;
    };

    // If categoryName provided but no categoryId, try to find or create
    let catId = categoryId || null;
    if (!catId && categoryName) {
      const found = await db
        .select()
        .from(categories)
        .where(eq(categories.name, categoryName));
      if (found.length > 0) catId = found[0].id;
      else {
        const res = await db.insert(categories).values({ name: categoryName });
        catId = getInsertId(res) || null;
      }
    }

    // Insert report (no user_id column)
    // Normalize reportDate to MySQL DATETIME string 'YYYY-MM-DD HH:MM:SS'
    let dbReportDate = null;
    if (reportDate) {
      try {
        const d = new Date(reportDate);
        if (!Number.isNaN(d.getTime())) {
          // Drizzle expects a JS Date for timestamp fields; store Date object
          dbReportDate = d;
        }
      } catch (e) {
        dbReportDate = null;
      }
    }

    const insertRes = await db.insert(reports).values({
      reportType,
      itemName,
      location,
      reportDate: dbReportDate,
      // ensure a sensible default so new reports show as available/unclaimed
      itemStatus: itemStatus || "available",
      categoryId: catId,
      description,
      contactInfo,
      contactEmail: contactEmail || null,
    });

    const reportId = getInsertId(insertRes);

    // Insert images if present
    if (reportId && Array.isArray(images) && images.length) {
      const imgs = images.map((url) => ({ reportId: reportId, url }));
      await db.insert(reportImages).values(imgs);
    }

    return new Response(JSON.stringify({ success: true, reportId }), {
      status: 200,
    });
  } catch (err) {
    console.error("/api/reports POST error", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // e.g. 'lost' or 'found'
    const emailFilter = searchParams.get("email"); // contact email filter
    const idParam = searchParams.get("id");

    let q = db.select().from(reports);
    if (status) {
      // allow filtering by either the report's itemStatus or the administrative reportType
      q = q.where(
        or(eq(reports.itemStatus, status), eq(reports.reportType, status))
      );
    }
    if (emailFilter) {
      q = q.where(eq(reports.contactEmail, emailFilter));
    }
    if (idParam) {
      const idNum = Number(idParam);
      if (!Number.isNaN(idNum)) q = q.where(eq(reports.id, idNum));
    }

    const rows = await q;

    // For each report, fetch images and category name
    const results = await Promise.all(
      rows.map(async (r) => {
        const imgs = await db
          .select()
          .from(reportImages)
          .where(eq(reportImages.reportId, r.id));
        let category = null;
        if (r.categoryId) {
          const cat = await db
            .select()
            .from(categories)
            .where(eq(categories.id, r.categoryId));
          if (cat.length) category = cat[0].name;
        }
        return {
          id: r.id,
          reportType: r.reportType,
          itemName: r.itemName,
          location: r.location,
          reportDate: r.reportDate,
          itemStatus: r.itemStatus,
          categoryId: r.categoryId,
          categoryName: category,
          description: r.description,
          contactInfo: r.contactInfo,
          contactEmail: r.contactEmail || null,
          images: imgs.map((i) => i.url),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      })
    );

    return new Response(JSON.stringify({ success: true, reports: results }), {
      status: 200,
    });
  } catch (err) {
    console.error("/api/reports GET error", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500 }
    );
  }
}
