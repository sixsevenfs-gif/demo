import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieOptions, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status === "INACTIVE") {
      return NextResponse.json({ error: "Invalid credentials or inactive account" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const cookieStore = cookies();
    const role = user.role as "ADMIN" | "CALLING_EXECUTIVE";
    if (role !== "ADMIN" && role !== "CALLING_EXECUTIVE") {
      return NextResponse.json({ error: "Account role is invalid. Contact an administrator." }, { status: 403 });
    }
    cookieStore.set("dwa_session", createSessionToken(user.id, role), sessionCookieOptions);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        dailyTarget: user.dailyTarget,
      },
    });
  } catch (error) {
    console.error("Login database error", error);
    return NextResponse.json(
      { error: "Database is temporarily unreachable. Check MongoDB Atlas Network Access and try again." },
      { status: 503 }
    );
  }
}
