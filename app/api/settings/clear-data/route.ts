import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clearEvidence } from "@/lib/evidence-store";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin authorization required" },
        { status: 403 },
      );
    }

    const { confirmation } = await request.json();
    if (confirmation !== "CLEAR DATA") {
      return NextResponse.json(
        { error: "Type CLEAR DATA to confirm this permanent action." },
        { status: 400 },
      );
    }

    const [
      attachments,
      calls,
      followUps,
      meetings,
      activities,
      internalNotes,
      noticeReceipts,
      notices,
      leads,
      auditLogs,
    ] = await Promise.all([
      prisma.attachment.count(),
      prisma.call.count(),
      prisma.followUp.count(),
      prisma.meeting.count(),
      prisma.activity.count(),
      prisma.internalNote.count(),
      prisma.noticeReceipt.count(),
      prisma.notice.count(),
      prisma.lead.count(),
      prisma.auditLog.count(),
    ]);

    // Delete dependent records before their parent leads/notices. User accounts and
    // saved configuration intentionally remain so the workspace stays accessible.
    await prisma.$transaction([
      prisma.attachment.deleteMany(),
      prisma.call.deleteMany(),
      prisma.followUp.deleteMany(),
      prisma.meeting.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.internalNote.deleteMany(),
      prisma.noticeReceipt.deleteMany(),
      prisma.notice.deleteMany(),
      prisma.lead.deleteMany(),
      prisma.auditLog.deleteMany(),
    ]);
    const evidenceFiles = await clearEvidence();

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "WORKSPACE_DATA_CLEARED",
        entityType: "Workspace",
        entityId: "workspace",
        details: `Cleared leads=${leads}, calls=${calls}, followUps=${followUps}, meetings=${meetings}, attachments=${attachments}, evidence=${evidenceFiles}, activities=${activities}, notes=${internalNotes}, notices=${notices}, noticeReceipts=${noticeReceipts}, auditLogs=${auditLogs}`,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        leads,
        calls,
        followUps,
        meetings,
        attachments,
        evidenceFiles,
        activities,
        internalNotes,
        notices,
        noticeReceipts,
        auditLogs,
      },
    });
  } catch (error) {
    console.error("Workspace data clear failed", error);
    return NextResponse.json(
      { error: "Could not clear workspace data." },
      { status: 500 },
    );
  }
}
