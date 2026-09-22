import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLeadSummary, getLeadOperationalInsight } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        calls: {
          orderBy: { callDate: "asc" },
          include: { executive: { select: { name: true } } },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const summary = generateLeadSummary(lead);
    const insight = getLeadOperationalInsight(lead);

    return NextResponse.json({
      success: true,
      summary,
      insight,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
