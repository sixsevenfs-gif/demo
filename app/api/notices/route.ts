import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const now = new Date();
  if (user.role === "ADMIN") {
    const notices = await prisma.notice.findMany({ include: { receipts: { include: { user: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 30 });
    return NextResponse.json({ notices });
  }
  const notices = await prisma.notice.findMany({
    where: { AND: [{ OR: [{ targetIds: { isEmpty: true } }, { targetIds: { has: user.id } }] }, { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }] },
    include: { receipts: { where: { userId: user.id } } }, orderBy: { createdAt: "desc" }, take: 30,
  });
  return NextResponse.json({ notices });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
  try {
    const { title, message, targetIds = [], priority = "NORMAL", expiresAt, requireAcknowledgement = false } = await req.json();
    if (!title?.trim() || !message?.trim()) return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    const recipients = targetIds.length ? await prisma.user.findMany({ where: { id: { in: targetIds }, role: "CALLING_EXECUTIVE", status: "ACTIVE" }, select: { id: true } }) : await prisma.user.findMany({ where: { role: "CALLING_EXECUTIVE", status: "ACTIVE" }, select: { id: true } });
    const notice = await prisma.notice.create({ data: { title: title.trim(), message: message.trim(), priority, targetIds: targetIds.length ? recipients.map((item) => item.id) : [], createdById: user.id, expiresAt: expiresAt ? new Date(expiresAt) : null, requireAcknowledgement, receipts: { create: recipients.map((item) => ({ userId: item.id })) } }, include: { receipts: true } });
    return NextResponse.json({ success: true, notice }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: "Could not create notice" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { noticeId, action } = await req.json();
  if (!noticeId || !["READ", "ACKNOWLEDGE"].includes(action)) return NextResponse.json({ error: "Invalid notice action" }, { status: 400 });
  const receipt = await prisma.noticeReceipt.findUnique({ where: { noticeId_userId: { noticeId, userId: user.id } } });
  if (!receipt) return NextResponse.json({ error: "Notice not found" }, { status: 404 });
  const data = action === "ACKNOWLEDGE" ? { readAt: receipt.readAt || new Date(), acknowledgedAt: new Date() } : { readAt: new Date() };
  await prisma.noticeReceipt.update({ where: { id: receipt.id }, data });
  return NextResponse.json({ success: true });
}
