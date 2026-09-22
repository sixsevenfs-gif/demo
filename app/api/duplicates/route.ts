import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    }
    // Find any leads sharing normalizedPhone
    const leads = await prisma.lead.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        businessName: true,
        phone: true,
        normalizedPhone: true,
        category: true,
        status: true,
        assignedTo: { select: { name: true } },
        callCount: true,
        createdAt: true,
      },
      orderBy: { normalizedPhone: "asc" },
    });

    const groups: Record<string, typeof leads> = {};
    for (const lead of leads) {
      if (!groups[lead.normalizedPhone]) {
        groups[lead.normalizedPhone] = [];
      }
      groups[lead.normalizedPhone].push(lead);
    }

    const duplicates = Object.entries(groups)
      .filter(([_, group]) => group.length > 1)
      .map(([phone, group]) => ({
        normalizedPhone: phone,
        count: group.length,
        leads: group,
      }));

    return NextResponse.json({ duplicates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Merge action: Merge duplicate lead into primary lead
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin authorization required to merge leads" },
        { status: 403 }
      );
    }

    const { primaryId, duplicateId } = await req.json();

    if (!primaryId || !duplicateId || primaryId === duplicateId) {
      return NextResponse.json({ error: "Invalid lead IDs" }, { status: 400 });
    }

    const [primary, duplicate] = await Promise.all([
      prisma.lead.findUnique({ where: { id: primaryId } }),
      prisma.lead.findUnique({ where: { id: duplicateId } }),
    ]);

    if (!primary || !duplicate) {
      return NextResponse.json({ error: "One or both leads not found" }, { status: 404 });
    }

    // Re-link all calls from duplicate to primary
    await prisma.call.updateMany({
      where: { leadId: duplicateId },
      data: { leadId: primaryId },
    });

    // Re-link all followUps from duplicate to primary
    await prisma.followUp.updateMany({
      where: { leadId: duplicateId },
      data: { leadId: primaryId },
    });

    // Re-link all activities
    await prisma.activity.updateMany({
      where: { leadId: duplicateId },
      data: { leadId: primaryId },
    });

    // Soft delete duplicate lead
    await prisma.lead.update({
      where: { id: duplicateId },
      data: { isDeleted: true },
    });

    // Update primary call count
    const totalCalls = await prisma.call.count({ where: { leadId: primaryId } });
    await prisma.lead.update({
      where: { id: primaryId },
      data: { callCount: totalCalls },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "LEAD_MERGED",
        entityType: "Lead",
        entityId: primaryId,
        details: `Merged duplicate lead "${duplicate.businessName}" (${duplicate.phone}) into primary lead "${primary.businessName}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully merged "${duplicate.businessName}" into "${primary.businessName}". All call histories preserved.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
