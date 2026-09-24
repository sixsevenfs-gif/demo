import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const end = new Date(start.getTime() + 86400000 - 1);
    if (user.role === "CALLING_EXECUTIVE") {
      const scope = { assignedToId: user.id, isDeleted: false };
      const leadInclude = { calls: { orderBy: { callDate: "desc" as const }, take: 1 } };
      const [callsDone, interested, followUps, meetings, callsPending, adminCallbackLead, dueNextLead, freshNextLead, dueFollowUps] = await Promise.all([
        prisma.call.count({ where: { executiveId: user.id, callDate: { gte: start, lte: end } } }),
        prisma.call.count({ where: { executiveId: user.id, callDate: { gte: start, lte: end }, outcome: "INTERESTED" } }),
        prisma.followUp.count({ where: { executiveId: user.id, status: "PENDING", scheduledAt: { gte: start, lte: end } } }),
        prisma.meeting.count({ where: { executiveId: user.id, status: "BOOKED", scheduledAt: { gte: start, lte: end } } }),
        prisma.lead.count({ where: { ...scope, isDoNotCall: false, status: { in: ["ASSIGNED", "NEW", "CALL_PENDING", "ATTEMPTED"] } } }),
        prisma.lead.findFirst({ where: { ...scope, isDoNotCall: false, adminCallbackNote: { not: null } }, orderBy: { adminCallbackAt: "desc" }, include: leadInclude }),
        prisma.lead.findFirst({ where: { ...scope, isDoNotCall: false, nextFollowUpDate: { lte: now }, status: { in: ["CALLBACK_REQUESTED", "NO_ANSWER", "FOLLOW_UP"] } }, orderBy: { nextFollowUpDate: "asc" }, include: leadInclude }),
        // Imported Mongo records may have an unset (rather than explicit null)
        // follow-up field. Assigned leads must still appear in the home queue.
        prisma.lead.findFirst({ where: { ...scope, isDoNotCall: false, status: { in: ["ASSIGNED", "NEW", "CALL_PENDING", "ATTEMPTED"] } }, orderBy: [{ callCount: "asc" }, { createdAt: "asc" }], include: leadInclude }),
        prisma.followUp.findMany({ where: { executiveId: user.id, status: "PENDING", scheduledAt: { lte: end } }, include: { lead: { select: { id: true, businessName: true, phone: true } } }, orderBy: { scheduledAt: "asc" }, take: 20 }),
      ]);
      const requestedLeadId = new URL(req.url).searchParams.get("leadId");
      const requestedLead = requestedLeadId ? await prisma.lead.findFirst({ where: { id: requestedLeadId, ...scope, isDoNotCall: false }, include: leadInclude }) : null;
      return NextResponse.json({ role: user.role, progress: { callsDone, callsPending, interested, followUps, meetings }, nextLead: requestedLead || adminCallbackLead || dueNextLead || freshNextLead, followUps: dueFollowUps });
    }
    const [totalLeads, interestedLeads, followUpsToday, meetingsBooked, unassignedLeads, activity, followUps, interested, executiveStatus, recentProofs, notices, executiveNotes] = await Promise.all([
      prisma.lead.count({ where: { isDeleted: false } }),
      prisma.lead.count({ where: { isDeleted: false, status: "INTERESTED" } }),
      prisma.followUp.count({ where: { status: "PENDING", scheduledAt: { gte: start, lte: end } } }),
      prisma.meeting.count({ where: { status: "BOOKED", scheduledAt: { gte: start, lte: end } } }),
      prisma.lead.count({ where: { isDeleted: false, assignedToId: null } }),
      // The dashboard is an operational view too: do not hide earlier calls
      // behind the View all link once the team logs more than 20 calls.
      prisma.call.findMany({ where: { callDate: { gte: start, lte: end } }, include: { executive: { select: { name: true } }, lead: { select: { id: true, businessName: true, category: true } }, attachments: { select: { id: true, type: true, filename: true } } }, orderBy: { callDate: "desc" }, take: 200 }),
      prisma.followUp.findMany({ where: { status: "PENDING", scheduledAt: { lte: end } }, include: { executive: { select: { name: true } }, lead: { select: { id: true, businessName: true, phone: true } } }, orderBy: { scheduledAt: "asc" }, take: 20 }),
      prisma.lead.findMany({ where: { isDeleted: false, status: "INTERESTED" }, include: { assignedTo: { select: { name: true } }, calls: { orderBy: { callDate: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, take: 20 }),
      prisma.user.findMany({ where: { role: "CALLING_EXECUTIVE" }, select: { id: true, name: true, status: true, avatar: true, _count: { select: { calls: { where: { callDate: { gte: start, lte: end } } }, followUps: { where: { status: "PENDING" } }, meetings: { where: { status: "BOOKED" } } } } } }),
      prisma.attachment.findMany({ include: { lead: { select: { id: true, businessName: true } }, executive: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
      prisma.notice.findMany({ include: { receipts: true }, orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.internalNote.findMany({ include: { sender: { select: { name: true } }, lead: { select: { id: true, businessName: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
    ]);
    // Keep the dashboard scan-friendly: one row per business, using its latest
    // call today. The complete attempt-by-attempt history stays in View all.
    const latestActivityByLead = activity.filter(
      (call, index, allCalls) =>
        allCalls.findIndex((candidate) => candidate.leadId === call.leadId) === index,
    );
    const connectedBusinessCalls = latestActivityByLead.filter(
      (call) => !["NO_ANSWER", "WRONG_NUMBER"].includes(call.outcome),
    ).length;
    return NextResponse.json({ role: user.role, summary: { totalLeads, callsToday: latestActivityByLead.length, connectedCalls: connectedBusinessCalls, interestedLeads, followUpsToday, meetingsBooked, unassignedLeads }, activity: latestActivityByLead, followUps, interested, executiveStatus, recentProofs, notices, executiveNotes });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Could not load dashboard" }, { status: 500 }); }
}
