import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "activity" | "audit"

    if (type === "audit") {
      const audits = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ audits });
    }

    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        lead: {
          select: { id: true, businessName: true, phone: true },
        },
      },
    });

    return NextResponse.json({ activities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
