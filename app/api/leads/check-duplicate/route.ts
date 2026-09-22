import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/phone";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get("phone");

    if (!rawPhone) {
      return NextResponse.json({ exists: false });
    }

    const normalized = normalizePhoneNumber(rawPhone);
    if (!normalized || normalized.length < 5) {
      return NextResponse.json({ exists: false });
    }

    // Look for exact match on normalizedPhone
    const existingLead = await prisma.lead.findFirst({
      where: {
        normalizedPhone: normalized,
        isDeleted: false,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        calls: {
          orderBy: { callDate: "desc" },
          take: 5,
          include: {
            executive: { select: { name: true } },
          },
        },
      },
    });

    if (!existingLead) {
      return NextResponse.json({ exists: false });
    }

    const lastCall = existingLead.calls[0] || null;

    return NextResponse.json({
      exists: true,
      lead: {
        id: existingLead.id,
        businessName: existingLead.businessName,
        phone: existingLead.phone,
        normalizedPhone: existingLead.normalizedPhone,
        category: existingLead.category,
        status: existingLead.status,
        priority: existingLead.priority,
        isDoNotCall: existingLead.isDoNotCall,
        assignedTo: existingLead.assignedTo ? existingLead.assignedTo.name : "Unassigned",
        assignedToId: existingLead.assignedToId,
        lastCall: lastCall
          ? {
              date: lastCall.callDate,
              outcome: lastCall.outcome,
              executiveName: lastCall.executive.name,
              notes: lastCall.notes,
            }
          : null,
        totalCalls: existingLead.callCount,
        nextFollowUp: existingLead.nextFollowUpDate,
        recentCalls: existingLead.calls,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
