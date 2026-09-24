import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    const executives = await prisma.user.findMany({
      where: { role: "CALLING_EXECUTIVE" },
      include: {
        assignedLeads: {
          select: { id: true, status: true, priority: true },
        },
        calls: {
          select: { id: true, outcome: true, callDate: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const stats = executives.map((exec) => {
      const callsToday = exec.calls.filter((c) => new Date(c.callDate) >= startOfToday).length;
      const totalCalls = exec.calls.length;
      const connected = exec.calls.filter((c) => c.outcome.startsWith("Connected")).length;
      const interested = exec.calls.filter((c) => c.outcome.includes("Interested")).length;
      const meetings = exec.calls.filter((c) => c.outcome.includes("Meeting")).length;
      const connectionRate = totalCalls > 0 ? Math.round((connected / totalCalls) * 100) : 0;

      return {
        id: exec.id,
        name: exec.name,
        email: exec.email,
        phone: exec.phone,
        status: exec.status,
        lastLoginAt: exec.lastLoginAt,
        avatar: exec.avatar || exec.name.slice(0, 2).toUpperCase(),
        dailyTarget: exec.dailyTarget,
        assignedLeadCount: exec.assignedLeads.length,
        callsToday,
        totalCalls,
        connected,
        interested,
        meetings,
        connectionRate: `${connectionRate}%`,
      };
    });

    return NextResponse.json({ executives: stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin authorization required to create executive accounts" },
        { status: 403 }
      );
    }

    const { name, email, phone, password, dailyTarget = 50 } = await req.json();

    if (!name || !email || !password || password.length < 12) {
      return NextResponse.json(
        { error: "Name, email, and a password of at least 12 characters are required" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const avatar = name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const executive = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone,
        passwordHash,
        role: "CALLING_EXECUTIVE",
        status: "ACTIVE",
        dailyTarget: parseInt(dailyTarget, 10) || 50,
        avatar,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "EXECUTIVE_CREATED",
        entityType: "User",
        entityId: executive.id,
        details: `Admin created executive account for ${name} (${email})`,
      },
    });

    return NextResponse.json({ success: true, executive });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    const { id, name, email, phone, status, dailyTarget, password } = await req.json();
    if (!id) return NextResponse.json({ error: "Executive ID is required" }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { id, role: "CALLING_EXECUTIVE" } });
    if (!existing) return NextResponse.json({ error: "Executive not found" }, { status: 404 });
    if (password && password.length < 12) return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
    const updated = await prisma.user.update({ where: { id }, data: { ...(name ? { name } : {}), ...(email ? { email: email.toLowerCase().trim() } : {}), ...(phone !== undefined ? { phone } : {}), ...(status === "ACTIVE" || status === "INACTIVE" ? { status } : {}), ...(dailyTarget ? { dailyTarget: Number(dailyTarget) } : {}), ...(password ? { passwordHash: await hashPassword(password) } : {}) } });
    await prisma.auditLog.create({ data: { userId: admin.id, userName: admin.name, action: password ? "EXECUTIVE_PASSWORD_RESET" : "EXECUTIVE_UPDATED", entityType: "User", entityId: id, details: `Admin updated executive ${updated.email}` } });
    return NextResponse.json({ success: true, executive: updated });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Could not update executive" }, { status: 500 }); }
}
