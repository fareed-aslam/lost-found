import { db } from "@/config/db";
import { categories } from "@/lib/schema/reportSchema";

export async function GET(req) {
  try {
    const rows = await db.select().from(categories);
    const mapped = rows.map((r) => ({ id: r.id, name: r.name }));
    return new Response(JSON.stringify({ success: true, categories: mapped }), {
      status: 200,
    });
  } catch (err) {
    console.error("/api/categories GET error", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500 }
    );
  }
}
