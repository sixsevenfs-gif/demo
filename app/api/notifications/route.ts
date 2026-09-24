import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  if (user.role === "ADMIN") {
    const notes = await prisma.internalNote.findMany({
      where: { OR: [{ adminReadAt: null }, { adminReadAt: { isSet: false } }] },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ notifications: notes.map((note) => ({ id: note.id, kind: "EXECUTIVE_NOTE", title: `${note.sender.name}: ${note.subject}`, message: note.message, createdAt: note.createdAt, read: false, href: "/admin/dashboard" })) });
  }

  const [receipts, replies, callbacks] = await Promise.all([
    prisma.noticeReceipt.findMany({ where: { userId: user.id, OR: [{ readAt: null }, { readAt: { isSet: false } }], notice: { OR: [{ expiresAt: null }, { expiresAt: { isSet: false } }, { expiresAt: { gt: new Date() } }] } }, include: { notice: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.internalNote.findMany({ where: { senderId: user.id, adminReply: { not: null }, OR: [{ senderReplyReadAt: null }, { senderReplyReadAt: { isSet: false } }] }, orderBy: { updatedAt: "desc" }, take: 30 }),
    prisma.lead.findMany({ where: { assignedToId: user.id, isDeleted: false, adminCallbackNote: { not: null }, OR: [{ adminCallbackSeenAt: null }, { adminCallbackSeenAt: { isSet: false } }] }, select: { id: true, businessName: true, adminCallbackNote: true, adminCallbackAt: true }, orderBy: { adminCallbackAt: "desc" }, take: 30 }),
  ]);
  const notifications = [
    ...receipts.map((receipt) => ({ id: receipt.noticeId, kind: "ADMIN_NOTICE", title: receipt.notice.title, message: receipt.notice.message, createdAt: receipt.notice.createdAt, read: false, href: "/executive/important-notes" })),
    ...replies.map((note) => ({ id: note.id, kind: "ADMIN_REPLY", title: `Admin replied: ${note.subject}`, message: note.adminReply, createdAt: note.updatedAt, read: false, href: "/executive/important-notes" })),
    ...callbacks.map((lead) => ({ id: lead.id, kind: "CALL_AGAIN", title: `Call again: ${lead.businessName}`, message: lead.adminCallbackNote, createdAt: lead.adminCallbackAt || new Date(), read: false, href: `/executive/dashboard?leadId=${lead.id}` })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id, kind } = await req.json();
  if (typeof id !== "string") return NextResponse.json({ error: "Invalid notification" }, { status: 400 });

  if (kind === "EXECUTIVE_NOTE" && user.role === "ADMIN") {
    const result = await prisma.internalNote.updateMany({ where: { id, OR: [{ adminReadAt: null }, { adminReadAt: { isSet: false } }] }, data: { adminReadAt: new Date() } });
    return result.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  if (kind === "ADMIN_REPLY" && user.role === "CALLING_EXECUTIVE") {
    const result = await prisma.internalNote.updateMany({ where: { id, senderId: user.id, adminReply: { not: null }, OR: [{ senderReplyReadAt: null }, { senderReplyReadAt: { isSet: false } }] }, data: { senderReplyReadAt: new Date() } });
    return result.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  if (kind === "ADMIN_NOTICE" && user.role === "CALLING_EXECUTIVE") {
    const result = await prisma.noticeReceipt.updateMany({ where: { noticeId: id, userId: user.id, OR: [{ readAt: null }, { readAt: { isSet: false } }] }, data: { readAt: new Date() } });
    return result.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  if (kind === "CALL_AGAIN" && user.role === "CALLING_EXECUTIVE") {
    const result = await prisma.lead.updateMany({ where: { id, assignedToId: user.id, adminCallbackNote: { not: null }, OR: [{ adminCallbackSeenAt: null }, { adminCallbackSeenAt: { isSet: false } }] }, data: { adminCallbackSeenAt: new Date() } });
    return result.count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Notification not found" }, { status: 404 });
}
