import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    await prisma.expense.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete expense" }, { status: 400 });
  }
}
