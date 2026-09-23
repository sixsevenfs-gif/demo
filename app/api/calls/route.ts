import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uploadEvidence } from "@/lib/evidence-store";

const OUTCOMES = new Set(["INTERESTED", "CALL_LATER", "NO_ANSWER", "NOT_INTERESTED", "WRONG_NUMBER", "MEETING_REQUIRED"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function text(form: FormData, key: string) { return String(form.get(key) || "").trim(); }
function validEvidence(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.size <= MAX_FILE_BYTES && IMAGE_TYPES.has(value.type);
}
function scheduledAt(date: string, time: string) {
  if (!date || !time) return null;
  const value = new Date(`${date}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const form = await req.formData();
    const leadId = text(form, "leadId");
    const outcome = text(form, "outcome");
    const summary = text(form, "summary");
    const outcomeReason = text(form, "outcomeReason");
    const followUpNote = text(form, "followUpNote");
    const whatsappPerformed = text(form, "whatsappPerformed") === "true";
    const followUpRequired = text(form, "followUpRequired") === "true";
    const followUpDate = text(form, "followUpDate");
    const followUpTime = text(form, "followUpTime");
    const meetingDate = text(form, "meetingDate");
    const meetingTime = text(form, "meetingTime");
    const whatsappSentType = text(form, "whatsappSentType");
    const whatsappNote = text(form, "whatsappNote");
    const durationSeconds = 0;
    const callLog = form.get("callLog");
    const whatsappProof = form.get("whatsappProof");

    if (!leadId || !OUTCOMES.has(outcome)) return NextResponse.json({ error: "Select a valid call result" }, { status: 400 });
    const needsSummary = !["NO_ANSWER", "WRONG_NUMBER"].includes(outcome);
    if (needsSummary && summary.length < 15) return NextResponse.json({ error: "Write a useful client conversation summary (at least 15 characters)" }, { status: 400 });
    if (outcome === "WRONG_NUMBER" && !outcomeReason) return NextResponse.json({ error: "Select what happened with this number" }, { status: 400 });
    if (outcome === "NOT_INTERESTED" && (!outcomeReason || summary.length < 15)) return NextResponse.json({ error: "Select a reason and write what the client said" }, { status: 400 });
    if (!validEvidence(callLog)) return NextResponse.json({ error: "A call-log screenshot (JPG, PNG or WebP, max 8 MB) is required" }, { status: 400 });
    if (whatsappPerformed) {
      if (!validEvidence(whatsappProof)) return NextResponse.json({ error: "A WhatsApp screenshot is required for this result" }, { status: 400 });
      if (!whatsappSentType) return NextResponse.json({ error: "Select what was sent on WhatsApp" }, { status: 400 });
    }
    if (outcome === "CALL_LATER" && !followUpRequired) return NextResponse.json({ error: "Call Later requires a follow-up" }, { status: 400 });
    const followAt = followUpRequired ? scheduledAt(followUpDate, followUpTime) : null;
    if (followUpRequired && !followAt) return NextResponse.json({ error: "Select a valid follow-up date and time" }, { status: 400 });
    const meetingAt = outcome === "MEETING_REQUIRED" ? scheduledAt(meetingDate, meetingTime) : null;
    if (outcome === "MEETING_REQUIRED" && !meetingAt) return NextResponse.json({ error: "Select a valid meeting date and time" }, { status: 400 });

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.isDeleted) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (user.role === "CALLING_EXECUTIVE" && lead.assignedToId !== user.id) return NextResponse.json({ error: "This lead is assigned to another executive" }, { status: 403 });

    const statusByOutcome: Record<string, string> = { INTERESTED: "INTERESTED", CALL_LATER: "CALLBACK_REQUESTED", MEETING_REQUIRED: "MEETING_SCHEDULED", NOT_INTERESTED: outcomeReason === "Asked Not to Contact Again" ? "DO_NOT_CALL" : "NOT_INTERESTED", NO_ANSWER: "NO_ANSWER", WRONG_NUMBER: "WRONG_NUMBER" };
    const call = await prisma.call.create({ data: { leadId, executiveId: user.id, outcome, durationSeconds, notes: summary || null, clientConversationSummary: summary || null, outcomeReason: outcomeReason || null, followUpNote: followUpNote || null, answeredStatus: outcome === "NO_ANSWER" ? "NO_ANSWER" : "ANSWERED", whatsappSentType: whatsappSentType || null, whatsappNote: whatsappNote || null, requiresFollowUp: followUpRequired, followUpDate: followUpDate || null, followUpTime: followUpTime || null, meetingDate: meetingDate || null, meetingTime: meetingTime || null } });

    const evidence: Array<{ file: File; type: string }> = [{ file: callLog, type: "CALL_LOG" }];
    if (validEvidence(whatsappProof)) evidence.push({ file: whatsappProof, type: "WHATSAPP" });
    for (const item of evidence) {
      const fileId = await uploadEvidence(Buffer.from(await item.file.arrayBuffer()), item.file.name, item.file.type);
      await prisma.attachment.create({ data: { leadId, callId: call.id, executiveId: user.id, type: item.type, fileId: fileId.toString(), filename: item.file.name, mimeType: item.file.type } });
    }
    if (followAt) await prisma.followUp.create({ data: { leadId, executiveId: user.id, scheduledAt: followAt, status: "PENDING", notes: summary } });
    if (meetingAt) await prisma.meeting.create({ data: { leadId, executiveId: user.id, scheduledAt: meetingAt, notes: summary } });

    // A no-answer without an explicit retry is retried tomorrow, never immediately.
    const retryAt = outcome === "NO_ANSWER" && !followAt ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
    const updatedLead = await prisma.lead.update({ where: { id: leadId }, data: { status: statusByOutcome[outcome] || "ATTEMPTED", isDoNotCall: outcome === "NOT_INTERESTED" && outcomeReason === "Asked Not to Contact Again" ? true : lead.isDoNotCall, lastCallDate: new Date(), lastCallOutcome: outcome, callCount: { increment: 1 }, nextFollowUpDate: followAt || meetingAt || retryAt || lead.nextFollowUpDate }, include: { assignedTo: { select: { id: true, name: true } } } });
    await prisma.activity.create({ data: { leadId, userId: user.id, userName: user.name, type: "CALL_MADE", description: `${user.name} logged ${outcome.replaceAll("_", " ")} for ${lead.businessName}`, metadata: JSON.stringify({ callId: call.id, outcome, durationSeconds, evidenceCount: evidence.length }) } });
    return NextResponse.json({ success: true, call, lead: updatedLead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not save call result" }, { status: 500 });
  }
}
