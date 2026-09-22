import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const allUsers = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true, avatar: true, dailyTarget: true },
      orderBy: { role: "asc" },
    });

    return NextResponse.json({
      user,
      allUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
