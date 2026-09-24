import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { categoryMatches, categoryMatchScore } from "@/lib/category";

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
  const activeScripts = await prisma.callingScript.findMany({ where: { status: "ACTIVE" }, include: { objections: { orderBy: { position: "asc" } } } });
  const matchedScripts = activeScripts.filter((item) => categoryMatches(item.category, lead.category));
  const script = lead.assignedScriptId
    ? lead.assignedScript?.status === "ACTIVE" ? lead.assignedScript : null
    : matchedScripts.sort((a, b) => Number(b.isDefaultForCategory) - Number(a.isDefaultForCategory) || categoryMatchScore(b.category, lead.category) - categoryMatchScore(a.category, lead.category))[0] || activeScripts.find((item) => item.category.toLowerCase() === "general business" && item.isDefaultForCategory);
  const resources = lead.assignedResourceId
    ? await prisma.resource.findMany({ where: { id: lead.assignedResourceId, status: "ACTIVE" } })
    : (await prisma.resource.findMany({ where: { status: "ACTIVE" }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] }))
        .filter((item) => item.category.toLowerCase() === "general" || categoryMatches(item.category, lead.category))
        .sort((a, b) => categoryMatchScore(b.category, lead.category) - categoryMatchScore(a.category, lead.category));
  return NextResponse.json({ script, scriptSource: lead.assignedScriptId ? "Assigned by Admin" : script ? (matchedScripts.length ? "Category default" : "General fallback") : null, resources, resourceSource: lead.assignedResourceId ? "Assigned by Admin" : "Category recommendations" });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, lead } = await permitted(params.id);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!lead) return NextResponse.json({ error: "Lead not found or unavailable" }, { status: 404 });
  const { resourceId, sent } = await req.json();
  if (!sent) return NextResponse.json({ success: true, recorded: false });
  if (user.role === "CALLING_EXECUTIVE" && lead.assignedResourceId && resourceId !== lead.assignedResourceId) return NextResponse.json({ error: "This link is not assigned to this lead" }, { status: 403 });
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, status: "ACTIVE" } });
  if (!resource) return NextResponse.json({ error: "Active resource not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.resourceUsage.create({ data: { resourceId, leadId: lead.id, executiveId: user.id } }),
    prisma.activity.create({ data: { leadId: lead.id, userId: user.id, userName: user.name, type: "RESOURCE_SENT", description: `${user.name} sent ${resource.name} to ${lead.businessName} via WhatsApp.`, metadata: JSON.stringify({ resourceId, resourceName: resource.name, channel: "WhatsApp" }) } }),
  ]);
  return NextResponse.json({ success: true, recorded: true });
}
