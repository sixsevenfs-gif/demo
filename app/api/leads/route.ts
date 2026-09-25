import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const executiveId = searchParams.get("executiveId");
    const source = searchParams.get("source");
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");
    const isDoNotCall = searchParams.get("isDoNotCall");
    const view = searchParams.get("view"); // "queue" or "all"
    const includeAllCalls = searchParams.get("includeCalls") === "all";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: any = { isDeleted: false };

    // Role-based restrictions: Executives only see their assigned leads
    if (user.role === "CALLING_EXECUTIVE") {
      where.assignedToId = user.id;
    } else if (executiveId) {
      if (executiveId === "unassigned") {
        where.assignedToId = null;
      } else {
        where.assignedToId = executiveId;
      }
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (source && source !== "ALL") {
      where.source = source;
    }
    if (category && category !== "ALL") where.category = category;
    if (platform && platform !== "ALL") where.platform = platform;

    if (isDoNotCall === "true") {
      where.isDoNotCall = true;
    } else if (isDoNotCall === "false") {
      where.isDoNotCall = false;
    }

    // Calling Queue specific exclusions
    if (view === "queue") {
      where.isDoNotCall = false;
      where.status = {
        notIn: ["DO_NOT_CALL", "WON", "WRONG_NUMBER", "CLOSED"],
      };
    }

    // Universal search
    if (search.trim()) {
      const q = search.trim();
      const normPhone = normalizePhoneNumber(q);

      where.OR = [
        { businessName: { contains: q } },
        { contactPerson: { contains: q } },
        { phone: { contains: q } },
        { category: { contains: q } },
        { city: { contains: q } },
        { address: { contains: q } },
      ];

      if (normPhone && normPhone.length >= 3) {
        where.OR.push({ normalizedPhone: { contains: normPhone } });
      }
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          calls: {
            orderBy: { callDate: "desc" },
            take: includeAllCalls ? 100 : 1,
            select: {
              id: true,
              outcome: true,
              callDate: true,
              notes: true,
              clientConversationSummary: true,
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { nextFollowUpDate: "asc" },
          { updatedAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      limit,
      leads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    const body = await req.json();

    const {
      businessName,
      contactPerson,
      phone,
      altPhone,
      whatsappNumber,
      email,
      website,
      category = "General Business",
      subcategory,
      platform,
      googleRating,
      reviewCount,
      address,
      area,
      city,
      state,
      pincode,
      source = "Manual",
      status = "NEW",
      priority = "NORMAL",
      assignedToId,
      notes,
      tags,
    } = body;

    if (!businessName && !phone) {
      return NextResponse.json(
        { error: "Business Name or Phone Number is required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone || "";
    const normalized = normalizePhoneNumber(cleanPhone);

    // Duplicate Check
    if (normalized && normalized.length >= 5) {
      const existing = await prisma.lead.findFirst({
        where: { normalizedPhone: normalized, isDeleted: false },
        include: {
          assignedTo: { select: { name: true } },
          calls: { orderBy: { callDate: "desc" }, take: 1 },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: "Existing lead found with this phone number",
            duplicate: true,
            existingLead: {
              id: existing.id,
              businessName: existing.businessName,
              phone: existing.phone,
              status: existing.status,
              assignedTo: existing.assignedTo?.name || "Unassigned",
              lastCall: existing.calls[0] || null,
              callCount: existing.callCount,
              nextFollowUpDate: existing.nextFollowUpDate,
            },
          },
          { status: 409 }
        );
      }
    }

    // Role protection: If executive, force assignment to self
    const finalAssignedTo =
      assignedToId || null;

    const lead = await prisma.lead.create({
      data: {
        businessName: businessName || "Unnamed business",
        contactPerson,
        phone: cleanPhone,
        normalizedPhone: normalized || cleanPhone,
        altPhone,
        whatsappNumber: whatsappNumber || cleanPhone,
        email,
        website,
        category,
        subcategory,
        platform,
        googleRating: googleRating === undefined || googleRating === null || googleRating === "" ? null : Number(googleRating),
        reviewCount: reviewCount === undefined || reviewCount === null || reviewCount === "" ? null : Number(reviewCount),
        address,
        area,
        city,
        state,
        pincode,
        source,
        status: finalAssignedTo ? (status === "NEW" ? "ASSIGNED" : status) : "UNASSIGNED",
        priority,
        assignedToId: finalAssignedTo,
        assignedAt: finalAssignedTo ? new Date() : null,
        callingAssignmentPending: !!finalAssignedTo,
        createdById: user?.id || null,
        notes,
        tags,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: user?.id,
        userName: user?.name || "System",
        type: "LEAD_CREATED",
        description: `${user?.name || "System"} added lead "${lead.businessName}"`,
        metadata: JSON.stringify({ source, phone: lead.phone, status: lead.status }),
      },
    });

    // Log Audit
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name || "System",
        action: "LEAD_CREATED",
        entityType: "Lead",
        entityId: lead.id,
        details: `Created lead "${lead.businessName}" (${lead.phone})`,
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
