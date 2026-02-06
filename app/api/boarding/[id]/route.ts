import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    await prisma.boardingLog.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete boarding entry" }, { status: 400 });
  }
}
