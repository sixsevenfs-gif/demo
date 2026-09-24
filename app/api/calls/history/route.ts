import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const date = params.get("date");
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00+05:30`).getTime()))) {
    return NextResponse.json({ error: "Use a valid date" }, { status: 400 });
  }
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const pageSize = user.role === "CALLING_EXECUTIVE" ? 50 : 200;
  const dayStart = date ? new Date(`${date}T00:00:00+05:30`) : null;
  const where = {
    ...(user.role === "CALLING_EXECUTIVE" ? { executiveId: user.id } : {}),
    ...(dayStart ? { callDate: { gte: dayStart, lt: new Date(dayStart.getTime() + 86_400_000) } } : {}),
  };
  const total = await prisma.call.count({ where });
  const calls = await prisma.call.findMany({
    where,
    include: { lead: { select: { id: true, businessName: true, phone: true, status: true, nextFollowUpDate: true, assignedToId: true, adminCallbackNote: true, adminCallbackAt: true } }, executive: { select: { id: true, name: true } }, attachments: { select: { id: true, type: true, filename: true } } },
    orderBy: { callDate: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
  });
  return NextResponse.json({ calls, total, page, hasMore: page * pageSize < total });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
  const { callId, note } = await req.json();
  if (!callId || !note?.trim() || note.trim().length < 5) return NextResponse.json({ error: "Write a callback reason of at least 5 characters" }, { status: 400 });
  const call = await prisma.call.findUnique({ where: { id: callId }, include: { lead: true, executive: { select: { name: true } } } });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.lead.update({ where: { id: call.leadId }, data: { assignedToId: call.executiveId, status: "CALL_PENDING", callingAssignmentPending: true, adminCallbackNote: note.trim(), adminCallbackAt: new Date(), adminCallbackSourceCallId: call.id, nextFollowUpDate: new Date() } }),
    prisma.activity.create({ data: { leadId: call.leadId, userId: user.id, userName: user.name, type: "ADMIN_CALLBACK_ASSIGNED", description: `${user.name} asked ${call.executive.name} to call ${call.lead.businessName} again.`, metadata: JSON.stringify({ callId, reason: note.trim() }) } }),
  ]);
  return NextResponse.json({ success: true });
}
