import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
 const user = await getCurrentUser(); if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 }); const body = await req.json();
 if (body.url) try { const url = new URL(body.url); if (!/^https?:$/.test(url.protocol)) throw new Error(); } catch { return NextResponse.json({ error: "Enter a valid http or https URL" }, { status: 400 }); }
 const allowed = ["name", "type", "category", "url", "description", "whatsappTemplate", "status", "isDefault"]; const data: any = {}; allowed.forEach((f) => { if (body[f] !== undefined) data[f] = body[f]; });
 const resource = await prisma.resource.update({ where: { id: params.id }, data }); return NextResponse.json({ resource });
}
