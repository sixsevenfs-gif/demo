import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function permitted(id: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, lead: null };
  const lead = await prisma.lead.findUnique({ where: { id }, include: { assignedScript: { include: { objections: { orderBy: { position: "asc" } } } } } });
  if (!lead || (user.role === "CALLING_EXECUTIVE" && lead.assignedToId !== user.id)) return { user, lead: null };
  return { user, lead };
}
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, lead } = await permitted(params.id);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!lead) return NextResponse.json({ error: "Lead not found or unavailable" }, { status: 404 });
  const script = lead.assignedScript || await prisma.callingScript.findFirst({ where: { category: lead.category, status: "ACTIVE", isDefaultForCategory: true }, include: { objections: { orderBy: { position: "asc" } } } }) || await prisma.callingScript.findFirst({ where: { category: "General Business", status: "ACTIVE", isDefaultForCategory: true }, include: { objections: { orderBy: { position: "asc" } } } });
  const resources = await prisma.resource.findMany({ where: { status: "ACTIVE", category: { in: [lead.category, "General"] } }, orderBy: [{ category: "asc" }, { isDefault: "desc" }, { updatedAt: "desc" }] });
  return NextResponse.json({ script, scriptSource: lead.assignedScript ? "Assigned by Admin" : script ? (script.category === lead.category ? "Category default" : "General fallback") : null, resources });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, lead } = await permitted(params.id);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!lead) return NextResponse.json({ error: "Lead not found or unavailable" }, { status: 404 });
  const { resourceId, sent } = await req.json();
  if (!sent) return NextResponse.json({ success: true, recorded: false });
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, status: "ACTIVE" } });
  if (!resource) return NextResponse.json({ error: "Active resource not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.resourceUsage.create({ data: { resourceId, leadId: lead.id, executiveId: user.id } }),
    prisma.activity.create({ data: { leadId: lead.id, userId: user.id, userName: user.name, type: "RESOURCE_SENT", description: `${user.name} sent ${resource.name} to ${lead.businessName} via WhatsApp.`, metadata: JSON.stringify({ resourceId, resourceName: resource.name, channel: "WhatsApp" }) } }),
  ]);
  return NextResponse.json({ success: true, recorded: true });
}
