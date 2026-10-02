import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CALLING_EXECUTIVE") return NextResponse.json({ error: "Executive authorization required" }, { status: 403 });
  const lead = await prisma.lead.findFirst({ where: { id: params.id, assignedToId: user.id, isDeleted: false } });
  if (!lead) return NextResponse.json({ error: "Lead not found in your queue" }, { status: 404 });
  await prisma.lead.update({ where: { id: lead.id }, data: { queueSkippedAt: new Date() } });
  return NextResponse.json({ success: true });
}
