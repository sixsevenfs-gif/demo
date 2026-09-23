import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const p = new URL(req.url).searchParams; const search = p.get("search") || ""; const category = p.get("category");
  const where: any = { ...(user.role === "CALLING_EXECUTIVE" ? { status: "ACTIVE" } : {}), ...(category ? { category: { in: [category, "General"] } } : {}), ...(search ? { OR: [{ name: { contains: search } }, { category: { contains: search } }, { type: { contains: search } }, { url: { contains: search } }] } : {}) };
  const resources = await prisma.resource.findMany({ where, include: { usages: { select: { sentAt: true, executive: { select: { name: true } } } }, _count: { select: { usages: true } } }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] });
  return NextResponse.json({ resources });
}
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(); if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
  const body = await req.json();
  try { const parsed = new URL(body.url); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); } catch { return NextResponse.json({ error: "Enter a valid http or https URL" }, { status: 400 }); }
  if (!body.name?.trim() || !body.type?.trim() || !body.category?.trim()) return NextResponse.json({ error: "Name, type and category are required" }, { status: 400 });
  const resource = await prisma.resource.create({ data: { name: body.name, type: body.type, category: body.category, url: body.url, description: body.description, whatsappTemplate: body.whatsappTemplate, status: body.status || "ACTIVE", isDefault: !!body.isDefault, createdById: user.id } });
  return NextResponse.json({ resource }, { status: 201 });
}
