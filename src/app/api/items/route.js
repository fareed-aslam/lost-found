import { NextResponse } from "next/server";
import { db } from "../../../config/db.js";
import { items } from "../../../../drizzle.config.js";

export async function GET() {
  try {
    const result = await db.select().from(items);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
