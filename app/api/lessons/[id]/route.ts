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
    await prisma.lessonLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete lesson" }, { status: 400 });
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
    const lesson = await prisma.lessonLog.update({
      where: { id },
      data: {
        paid: body.paid !== undefined ? Boolean(body.paid) : undefined
      }
    });
    return NextResponse.json(lesson);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update lesson" }, { status: 400 });
  }
}
