import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function indiaDate(value = new Date()) {
  const indiaTime = new Date(value.getTime() + 5.5 * 60 * 60 * 1000);
  return `${indiaTime.getUTCFullYear()}-${String(indiaTime.getUTCMonth() + 1).padStart(2, "0")}-${String(indiaTime.getUTCDate()).padStart(2, "0")}`;
}

function rangeFor(date: string) {
  const start = new Date(`${date}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1) };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.role !== "CALLING_EXECUTIVE") return NextResponse.json({ error: "Executive authorization required" }, { status: 403 });

  const todayDate = indiaDate();
  const requestedDate = new URL(req.url).searchParams.get("date") || todayDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || Number.isNaN(rangeFor(requestedDate).start.getTime())) {
    return NextResponse.json({ error: "Use a valid date" }, { status: 400 });
  }
  const yesterdayDate = indiaDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const snapshot = async (date: string) => {
    const { start, end } = rangeFor(date);
    const callScope = { executiveId: user.id, callDate: { gte: start, lte: end } };
    const meetingScope = { executiveId: user.id, createdAt: { gte: start, lte: end } };
    const [calls, connected, interested, callbacks, meetings] = await Promise.all([
      prisma.call.count({ where: callScope }),
      prisma.call.count({ where: { ...callScope, outcome: { notIn: ["NO_ANSWER", "WRONG_NUMBER"] } } }),
      prisma.call.count({ where: { ...callScope, outcome: "INTERESTED" } }),
      prisma.call.count({ where: { ...callScope, outcome: "CALL_LATER" } }),
      prisma.meeting.count({ where: meetingScope }),
    ]);
    return { date, calls, connected, interested, callbacks, meetings };
  };

  const [today, yesterday, selected, lifetimeCalls] = await Promise.all([
    snapshot(todayDate),
    snapshot(yesterdayDate),
    snapshot(requestedDate),
    prisma.call.count({ where: { executiveId: user.id } }),
  ]);
  return NextResponse.json({ today, yesterday, selected, lifetimeCalls });
}
