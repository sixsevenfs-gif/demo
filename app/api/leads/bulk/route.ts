import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin authorization required for bulk operations" },
        { status: 403 }
      );
    }

    const {
      leadIds,
      action, // "ASSIGN", "ROUND_ROBIN", "STATUS", "PRIORITY", "TAG"
      executiveId,
      executiveIds,
      status,
      priority,
      tag,
      assignedScriptId,
      assignedResourceId,
    } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No leads selected for bulk action" },
        { status: 400 }
      );
    }

    if (action === "ASSIGN" || action === "TOOLKIT") {
      if (action === "ASSIGN" && !executiveId) {
        return NextResponse.json(
          { error: "Target executive ID is required" },
          { status: 400 }
        );
      }

      if (action === "TOOLKIT" && assignedScriptId === undefined && assignedResourceId === undefined) {
        return NextResponse.json({ error: "Choose a script or link to assign" }, { status: 400 });
      }

      const execUser = action === "ASSIGN" ? await prisma.user.findFirst({
        where: { id: executiveId, role: "CALLING_EXECUTIVE", status: "ACTIVE" },
        select: { id: true, name: true },
      }) : null;
      if (action === "ASSIGN" && !execUser) {
        return NextResponse.json(
          { error: "Selected calling executive is disabled or unavailable" },
          { status: 400 }
        );
      }

      if (assignedScriptId !== undefined && assignedScriptId !== null) {
        const script = await prisma.callingScript.findFirst({ where: { id: assignedScriptId, status: "ACTIVE" }, select: { id: true } });
        if (!script) return NextResponse.json({ error: "Choose an active script" }, { status: 400 });
      }
      if (assignedResourceId !== undefined && assignedResourceId !== null) {
        const resource = await prisma.resource.findFirst({ where: { id: assignedResourceId, status: "ACTIVE" }, select: { id: true } });
        if (!resource) return NextResponse.json({ error: "Choose an active link" }, { status: 400 });
      }

      const result = await prisma.lead.updateMany({
        where: { id: { in: leadIds }, isDeleted: false },
        data: {
          ...(action === "ASSIGN" ? { assignedToId: executiveId, status: "ASSIGNED", callingAssignmentPending: true } : {}),
          ...(assignedScriptId !== undefined ? { assignedScriptId } : {}),
          ...(assignedResourceId !== undefined ? { assignedResourceId } : {}),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: action === "ASSIGN" ? "BULK_ASSIGNED" : "BULK_TOOLKIT_ASSIGNED",
          entityType: "Lead",
          entityId: "BULK",
          details: `${action === "ASSIGN" ? `Assigned to ${execUser?.name}` : "Updated toolkit"} for ${result.count} leads; script ${assignedScriptId === undefined ? "unchanged" : assignedScriptId || "category default"}; link ${assignedResourceId === undefined ? "unchanged" : assignedResourceId || "category default"}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: action === "ASSIGN" ? `Assigned ${result.count} leads to ${execUser?.name || "Executive"}` : `Updated script/link for ${result.count} leads`,
      });
    }

    if (action === "ROUND_ROBIN") {
      // Get target executives
      let execs: Array<{ id: string; name: string }> = [];
      if (Array.isArray(executiveIds) && executiveIds.length > 0) {
        execs = await prisma.user.findMany({
          where: { id: { in: executiveIds }, status: "ACTIVE" },
          select: { id: true, name: true },
        });
      } else {
        execs = await prisma.user.findMany({
          where: { role: "CALLING_EXECUTIVE", status: "ACTIVE" },
          select: { id: true, name: true },
        });
      }

      if (execs.length === 0) {
        return NextResponse.json(
          { error: "No active calling executives available for round-robin assignment" },
          { status: 400 }
        );
      }

      // Distribute leads evenly
      const updates = leadIds.map((id, index) => {
        const assignedExec = execs[index % execs.length];
        return prisma.lead.update({
          where: { id },
          data: {
            assignedToId: assignedExec.id,
            status: "ASSIGNED",
            callingAssignmentPending: true,
          },
        });
      });

      await prisma.$transaction(updates);

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: "ROUND_ROBIN_ASSIGNMENT",
          entityType: "Lead",
          entityId: "BULK",
          details: `Evenly distributed ${leadIds.length} leads across ${execs.length} executives (${execs.map((e) => e.name).join(", ")})`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully distributed ${leadIds.length} leads across ${execs.length} executives evenly`,
      });
    }

    if (action === "STATUS" && status) {
      await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        message: `Updated status to ${status} for ${leadIds.length} leads`,
      });
    }

    if (action === "PRIORITY" && priority) {
      await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { priority },
      });

      return NextResponse.json({
        success: true,
        message: `Updated priority to ${priority} for ${leadIds.length} leads`,
      });
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
