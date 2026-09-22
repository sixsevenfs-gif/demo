import { NextRequest, NextResponse } from "next/server";
import { cleanupCallNotes } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { notes } = await req.json();
    if (!notes) {
      return NextResponse.json({ cleanedNotes: "" });
    }

    const cleanedNotes = await cleanupCallNotes(notes);
    return NextResponse.json({ success: true, cleanedNotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
