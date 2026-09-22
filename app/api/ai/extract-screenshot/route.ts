import { NextRequest, NextResponse } from "next/server";
import { extractBusinessFromScreenshot } from "@/lib/ai";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN")
      return NextResponse.json(
        { error: "Admin authorization required" },
        { status: 403 },
      );
    const { imageBase64, filename, images } = await req.json();

    let extractedList: any[] = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        const item = await extractBusinessFromScreenshot(
          img.base64,
          img.filename,
        );
        extractedList.push(item);
      }
    } else if (imageBase64) {
      const item = await extractBusinessFromScreenshot(imageBase64, filename);
      extractedList.push(item);
    } else {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 },
      );
    }

    // Check duplicates for each extracted lead
    const results = await Promise.all(
      extractedList.map(async (extracted) => {
        const normPhone = normalizePhoneNumber(extracted.phone);
        let existingLead: any = null;

        if (normPhone && normPhone.length >= 5) {
          existingLead = await prisma.lead.findFirst({
            where: { normalizedPhone: normPhone, isDeleted: false },
            include: {
              assignedTo: { select: { name: true } },
              calls: { orderBy: { callDate: "desc" }, take: 1 },
            },
          });
        }

        return {
          extracted,
          duplicateFound: !!existingLead,
          existingLead: existingLead
            ? {
                id: existingLead.id,
                businessName: existingLead.businessName,
                phone: existingLead.phone,
                status: existingLead.status,
                assignedTo: existingLead.assignedTo?.name || "Unassigned",
                callCount: existingLead.callCount,
                nextFollowUpDate: existingLead.nextFollowUpDate,
                lastCall: existingLead.calls[0] || null,
              }
            : null,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      items: results,
      primary: results[0] || null,
    });
  } catch (error: any) {
    if (error.message === "AI_IMPORT_NOT_CONFIGURED")
      return NextResponse.json(
        {
          error:
            "AI import is not configured. Add GEMINI_API_KEY in the server environment.",
        },
        { status: 503 },
      );
    if (error.message === "AI_RATE_LIMITED")
      return NextResponse.json(
        {
          error:
            "Gemini free-tier limit reached. Wait a minute and retry; if it persists, wait for the quota reset or use a billed Gemini API project.",
        },
        { status: 429 },
      );
    if (error.message === "AI_KEY_REJECTED")
      return NextResponse.json(
        {
          error:
            "Gemini API key was rejected. Check GEMINI_API_KEY in Vercel environment variables.",
        },
        { status: 503 },
      );
    return NextResponse.json(
      {
        error:
          "Could not extract business details. Try again or enter details manually.",
      },
      { status: 422 },
    );
  }
}
