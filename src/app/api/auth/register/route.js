import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/config/db";
import { users } from "@/lib/schema/userSchema";
import { hashPassword } from "@/utils/hash";

const registerSchema = z.object({
  fullName: z.string().min(3),
  userName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phoneNumber: z.string().min(10).or(z.literal("")).optional(),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check if user already exists by email
    const emailUser = await db
      .select()
      .from(users)
      .where(`email = ?`, [data.email]);
    if (emailUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 409 }
      );
    }
    // Check if user already exists by username
    const usernameUser = await db
      .select()
      .from(users)
      .where(`username = ?`, [data.userName]);
    if (usernameUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username is already taken" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(data.password);
    const result = await db.insert(users).values({
      fullName: data.fullName,
      userName: data.userName,
      email: data.email,
      password: hashedPassword,
      phoneNumber: data.phoneNumber,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        userId: result.insertId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    // Handle MySQL duplicate entry error (code 1062)
    if (
      err.code === "ER_DUP_ENTRY" ||
      err.errno === 1062 ||
      (err.message && err.message.toLowerCase().includes("duplicate"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User already exists. Please use a different email or username.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 400 }
    );
  }
}
