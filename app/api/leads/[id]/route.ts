import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const lead = await prisma.lead.findUnique({
      where: { id: params.id, isDeleted: false },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        calls: {
          orderBy: { callDate: "desc" },
          include: {
            executive: { select: { id: true, name: true, avatar: true } },
            attachments: { select: { id: true, type: true, filename: true, createdAt: true } },
          },
        },
        followUps: {
          orderBy: { scheduledAt: "asc" },
          include: {
            executive: { select: { id: true, name: true } },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Role safety: Executive cannot view someone else's private lead unless assigned
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role === "CALLING_EXECUTIVE" && lead.assignedToId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. This lead is assigned to another executive." },
        { status: 403 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const leadId = params.id;
    const body = await req.json();

    const existing = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Executive restriction
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (user.role === "CALLING_EXECUTIVE" && existing.assignedToId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You cannot edit leads assigned to others." },
        { status: 403 }
      );
    }

    // Lead records are master data. Executives update operational progress through
    // the call and follow-up APIs only; they must not be able to alter lead details.
    if (user.role === "CALLING_EXECUTIVE") {
      return NextResponse.json(
        { error: "Lead details are managed by admins. Use call reporting or follow-ups to update progress." },
        { status: 403 }
      );
    }

    const dataToUpdate: any = {};
    const allowedFields = [
      "businessName",
      "contactPerson",
      "phone",
      "altPhone",
      "whatsappNumber",
      "email",
      "website",
      "category",
      "subcategory",
      "platform",
      "address",
      "area",
      "city",
      "state",
      "pincode",
      "source",
      "status",
      "priority",
      "notes",
      "tags",
      "isDoNotCall",
      "assignedScriptId",
      "assignedResourceId",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field];
      }
    }

    if (body.phone) {
      dataToUpdate.normalizedPhone = normalizePhoneNumber(body.phone);
    }

    if (body.assignedScriptId) {
      const script = await prisma.callingScript.findFirst({ where: { id: body.assignedScriptId, status: "ACTIVE" }, select: { id: true } });
      if (!script) return NextResponse.json({ error: "Choose an active script" }, { status: 400 });
    }
    if (body.assignedResourceId) {
      const resource = await prisma.resource.findFirst({ where: { id: body.assignedResourceId, status: "ACTIVE" }, select: { id: true } });
      if (!resource) return NextResponse.json({ error: "Choose an active link" }, { status: 400 });
    }

    // Admin-only field: reassign lead
    if (body.assignedToId !== undefined) {
      if (user && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only admins can reassign leads." },
          { status: 403 }
        );
      }
      if (body.assignedToId && existing.callCount > 0 && (!body.assignmentNote?.trim() || body.assignmentNote.trim().length < 5)) {
        return NextResponse.json({ error: "Write why this previously called lead needs another call (at least 5 characters)" }, { status: 400 });
      }
      dataToUpdate.assignedToId = body.assignedToId;
      dataToUpdate.assignedAt = body.assignedToId ? new Date() : null;
      dataToUpdate.status = body.assignedToId ? "ASSIGNED" : "UNASSIGNED";
      dataToUpdate.callingAssignmentPending = !!body.assignedToId;
      dataToUpdate.adminCallbackNote = body.assignedToId ? body.assignmentNote?.trim() || null : null;
      dataToUpdate.adminCallbackAt = body.assignedToId && body.assignmentNote?.trim() ? new Date() : null;
      dataToUpdate.adminCallbackSeenAt = null;
      dataToUpdate.adminCallbackSourceCallId = null;
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: dataToUpdate,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Log status or assignment changes in activities & audit
    if (body.status && body.status !== existing.status) {
      await prisma.activity.create({
        data: {
          leadId,
          userId: user?.id,
          userName: user?.name || "System",
          type: "STATUS_CHANGED",
          description: `${user?.name || "User"} changed status to "${body.status}"`,
          metadata: JSON.stringify({ from: existing.status, to: body.status }),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name || "System",
        action: "LEAD_UPDATED",
        entityType: "Lead",
        entityId: leadId,
        details: `Updated fields: ${Object.keys(dataToUpdate).join(", ")}`,
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Executives cannot delete leads. Admin authorization required." },
        { status: 403 }
      );
    }

    const leadId = params.id;
    await prisma.lead.update({
      where: { id: leadId },
      data: { isDeleted: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "LEAD_DELETED",
        entityType: "Lead",
        entityId: leadId,
        details: `Admin soft-deleted lead ${leadId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
