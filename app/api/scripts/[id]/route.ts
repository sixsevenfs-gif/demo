import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const fields = ["name", "category", "subcategory", "language", "status", "description", "opening", "discoveryQuestions", "problem", "solution", "demoIntroduction", "priceResponse", "closing", "whatsappFollowUp", "internalInstructions", "isDefaultForCategory"];
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
  const body = await req.json(); const existing = await prisma.callingScript.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Script not found" }, { status: 404 });
  const data: any = { updatedByName: user.name, version: { increment: 1 } }; fields.forEach((f) => { if (body[f] !== undefined) data[f] = body[f]; });
  if (data.isDefaultForCategory) await prisma.callingScript.updateMany({ where: { category: data.category || existing.category, isDefaultForCategory: true, id: { not: params.id } }, data: { isDefaultForCategory: false } });
  if (body.objections) { await prisma.scriptObjection.deleteMany({ where: { scriptId: params.id } }); data.objections = { create: body.objections.filter((o: any) => o.objection && o.response).map((o: any, position: number) => ({ objection: o.objection, response: o.response, position })) }; }
  const script = await prisma.callingScript.update({ where: { id: params.id }, data, include: { objections: { orderBy: { position: "asc" } } } });
  return NextResponse.json({ script });
}
