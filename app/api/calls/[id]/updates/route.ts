import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { note } = await req.json();
    if (!note?.trim() || note.trim().length < 3) {
      return NextResponse.json({ error: "Write an update of at least 3 characters" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({ where: { id: params.id }, include: { lead: { select: { id: true, businessName: true } } } });
    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    if (user.role === "CALLING_EXECUTIVE" && call.executiveId !== user.id) {
      return NextResponse.json({ error: "You can only update your own calls" }, { status: 403 });
    }

    const update = await prisma.callUpdate.create({ data: { callId: call.id, executiveId: user.id, note: note.trim() } });
    await prisma.activity.create({
      data: {
        leadId: call.leadId,
        userId: user.id,
        userName: user.name,
        type: "CALL_UPDATED",
        description: `${user.name} added an update to the call with ${call.lead.businessName}.`,
        metadata: JSON.stringify({ callId: call.id, updateId: update.id }),
      },
    });
    return NextResponse.json({ success: true, update });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not save call update" }, { status: 500 });
  }
}
