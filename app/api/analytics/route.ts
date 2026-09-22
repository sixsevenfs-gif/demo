import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const totalLeads = await prisma.lead.count({ where: { isDeleted: false } });

    // Group leads by source
    const leadsBySource = await prisma.lead.groupBy({
      by: ["source"],
      where: { isDeleted: false },
      _count: { id: true },
    });

    const sources = leadsBySource.map((item) => {
      const share = totalLeads > 0 ? `${Math.round((item._count.id / totalLeads) * 100)}%` : "0%";
      return {
        name: item.source || "Other",
        leads: item._count.id,
        share,
      };
    }).sort((a, b) => b.leads - a.leads);

    // Group leads by category
    const leadsByCategory = await prisma.lead.groupBy({
      by: ["category"],
      where: { isDeleted: false },
      _count: { id: true },
      _sum: { callCount: true },
    });

    const categories = leadsByCategory.map((cat) => {
      const callCount = cat._sum.callCount || 0;
      return {
        name: cat.category || "General Business",
        leads: cat._count.id,
        calls: callCount,
      };
    }).sort((a, b) => b.calls - a.calls);

    return NextResponse.json({
      totalLeads,
      sources,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
