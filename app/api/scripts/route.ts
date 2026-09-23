import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const fields = ["name", "category", "subcategory", "language", "status", "description", "opening", "discoveryQuestions", "problem", "solution", "demoIntroduction", "priceResponse", "closing", "whatsappFollowUp", "internalInstructions", "isDefaultForCategory"];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const search = q.get("search") || "";
  const where: any = { ...(user.role === "CALLING_EXECUTIVE" ? { status: "ACTIVE" } : {}), ...(search ? { OR: [{ name: { contains: search } }, { category: { contains: search } }] } : {}) };
  const scripts = await prisma.callingScript.findMany({ where, include: { objections: { orderBy: { position: "asc" } }, _count: { select: { leads: true } } }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
  return NextResponse.json({ scripts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
  const body = await req.json();
  if (!body.name?.trim() || !body.category?.trim()) return NextResponse.json({ error: "Script name and category are required" }, { status: 400 });
  const data: any = { createdById: user.id, updatedByName: user.name };
  fields.forEach((field) => { if (body[field] !== undefined) data[field] = body[field]; });
  if (data.isDefaultForCategory) await prisma.callingScript.updateMany({ where: { category: data.category, isDefaultForCategory: true }, data: { isDefaultForCategory: false } });
  const script = await prisma.callingScript.create({ data: { ...data, objections: { create: (body.objections || []).filter((o: any) => o.objection && o.response).map((o: any, position: number) => ({ objection: o.objection, response: o.response, position })) }, }, include: { objections: true } });
  return NextResponse.json({ script }, { status: 201 });
}
