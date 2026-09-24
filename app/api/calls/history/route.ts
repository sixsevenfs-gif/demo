import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const calls = await prisma.call.findMany({
    where: user.role === "CALLING_EXECUTIVE" ? { executiveId: user.id } : {},
    include: { lead: { select: { id: true, businessName: true, phone: true, assignedToId: true, adminCallbackNote: true, adminCallbackAt: true } }, executive: { select: { id: true, name: true } }, attachments: { select: { id: true, type: true, filename: true } } },
    orderBy: { callDate: "desc" }, take: 200,
  });
  return NextResponse.json({ calls });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
  const { callId, note } = await req.json();
  if (!callId || !note?.trim() || note.trim().length < 5) return NextResponse.json({ error: "Write a callback reason of at least 5 characters" }, { status: 400 });
  const call = await prisma.call.findUnique({ where: { id: callId }, include: { lead: true, executive: { select: { name: true } } } });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.lead.update({ where: { id: call.leadId }, data: { assignedToId: call.executiveId, status: "CALL_PENDING", adminCallbackNote: note.trim(), adminCallbackAt: new Date(), nextFollowUpDate: new Date() } }),
    prisma.activity.create({ data: { leadId: call.leadId, userId: user.id, userName: user.name, type: "ADMIN_CALLBACK_ASSIGNED", description: `${user.name} asked ${call.executive.name} to call ${call.lead.businessName} again.`, metadata: JSON.stringify({ callId, reason: note.trim() }) } }),
  ]);
  return NextResponse.json({ success: true });
}
