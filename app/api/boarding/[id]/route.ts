import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    await prisma.boardingLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete boarding entry" }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const boarding = await prisma.boardingLog.update({
      where: { id },
      data: {
        paid: body.paid !== undefined ? Boolean(body.paid) : undefined
      }
    });
    return NextResponse.json(boarding);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update boarding" }, { status: 400 });
  }
}
