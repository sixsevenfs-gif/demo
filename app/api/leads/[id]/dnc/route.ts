import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const leadId = params.id;
    const { action, reason } = await req.json(); // action: "ENABLE" | "DISABLE"

    const existing = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (action === "DISABLE") {
      // Only admin can remove DNC
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only Admins can remove Do Not Call restrictions." },
          { status: 403 }
        );
      }

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          isDoNotCall: false,
          status: "ATTEMPTED",
          dncReason: null,
          dncDate: null,
          dncMarkedBy: null,
        },
      });

      await prisma.activity.create({
        data: {
          leadId,
          userId: user.id,
          userName: user.name,
          type: "DNC_REMOVED",
          description: `${user.name} removed Do Not Call restriction`,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: "DNC_REMOVED",
          entityType: "Lead",
          entityId: leadId,
          details: `DNC restriction removed by Admin`,
        },
      });

      return NextResponse.json({ success: true, isDoNotCall: false });
    }

    // ENABLE DNC
    const dncReasonText = reason || "Customer requested Do Not Call status.";
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        isDoNotCall: true,
        status: "DO_NOT_CALL",
        dncReason: dncReasonText,
        dncDate: new Date(),
        dncMarkedBy: user?.name || "System",
      },
    });

    await prisma.activity.create({
      data: {
        leadId,
        userId: user?.id,
        userName: user?.name || "System",
        type: "DNC_APPLIED",
        description: `Lead placed on DO NOT CALL registry. Reason: ${dncReasonText}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name || "System",
        action: "DNC_APPLIED",
        entityType: "Lead",
        entityId: leadId,
        details: `Reason: ${dncReasonText}`,
      },
    });

    return NextResponse.json({ success: true, isDoNotCall: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
