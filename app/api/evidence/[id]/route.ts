import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readEvidence } from "@/lib/evidence-store";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const attachment = await prisma.attachment.findUnique({ where: { id: params.id } });
    if (!attachment) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    if (user.role !== "ADMIN" && attachment.executiveId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const chunks: Buffer[] = [];
    for await (const chunk of await readEvidence(attachment.fileId)) chunks.push(Buffer.from(chunk));
    return new NextResponse(Buffer.concat(chunks), { headers: { "Content-Type": attachment.mimeType, "Content-Disposition": `inline; filename="${attachment.filename.replace(/["\r\n]/g, "")}"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not read evidence" }, { status: 500 });
  }
}
