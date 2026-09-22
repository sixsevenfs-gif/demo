import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const where: any = {
      lead: { isDeleted: false },
    };

    if (user.role === "CALLING_EXECUTIVE") {
      where.executiveId = user.id;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            category: true,
            city: true,
            status: true,
            priority: true,
            isDoNotCall: true,
          },
        },
        executive: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const overdue = followUps.filter(
      (f) => f.status === "PENDING" && new Date(f.scheduledAt) < now
    );

    const today = followUps.filter(
      (f) =>
        f.status === "PENDING" &&
        new Date(f.scheduledAt) >= startOfToday &&
        new Date(f.scheduledAt) <= endOfToday
    );

    const tomorrow = followUps.filter(
      (f) =>
        f.status === "PENDING" &&
        new Date(f.scheduledAt) >= startOfTomorrow &&
        new Date(f.scheduledAt) <= endOfTomorrow
    );

    const upcoming = followUps.filter(
      (f) => f.status === "PENDING" && new Date(f.scheduledAt) > endOfTomorrow
    );

    const completed = followUps.filter((f) => f.status === "COMPLETED");

    return NextResponse.json({
      counts: {
        overdue: overdue.length,
        today: today.length,
        tomorrow: tomorrow.length,
        upcoming: upcoming.length,
        completed: completed.length,
      },
      overdue,
      today,
      tomorrow,
      upcoming,
      completed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, scheduledAt, notes } = await req.json();
    const existing = await prisma.followUp.findUnique({ where: { id } });
    if (!existing || (user.role === "CALLING_EXECUTIVE" && existing.executiveId !== user.id)) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });

    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (status === "COMPLETED") data.completedAt = new Date();
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);

    const updated = await prisma.followUp.update({
      where: { id },
      data,
      include: { lead: true },
    });

    if (scheduledAt) {
      await prisma.lead.update({
        where: { id: updated.leadId },
        data: { nextFollowUpDate: new Date(scheduledAt) },
      });
    }

    return NextResponse.json({ success: true, followUp: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
