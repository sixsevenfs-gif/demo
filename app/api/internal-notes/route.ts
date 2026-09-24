import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const where = user.role === "ADMIN" ? {} : { senderId: user.id };
  const notes = await prisma.internalNote.findMany({ where, include: { sender: { select: { id: true, name: true } }, lead: { select: { id: true, businessName: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CALLING_EXECUTIVE") return NextResponse.json({ error: "Calling executive authorization required" }, { status: 403 });
  const { subject, message, type = "GENERAL_NOTE", priority = "NORMAL", leadId } = await req.json();
  if (!subject?.trim() || !message?.trim()) return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  if (leadId) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, assignedToId: user.id, isDeleted: false } });
    if (!lead) return NextResponse.json({ error: "Invalid assigned lead" }, { status: 403 });
  }
  const note = await prisma.internalNote.create({ data: { senderId: user.id, leadId: leadId || null, subject: subject.trim(), message: message.trim(), type, priority }, include: { sender: { select: { name: true } }, lead: { select: { businessName: true } } } });
  return NextResponse.json({ success: true, note }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
  const { id, status, adminReply } = await req.json();
  if (!id) return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
  const note = await prisma.internalNote.update({ where: { id }, data: { status: status || undefined, adminReply: adminReply?.trim() || undefined, senderReplyReadAt: adminReply?.trim() ? null : undefined, resolvedAt: status === "RESOLVED" ? new Date() : undefined } });
  return NextResponse.json({ success: true, note });
}
