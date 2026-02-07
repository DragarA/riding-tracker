import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();

    const client = await prisma.client.update({
      where: { id },
      data: {
        defaultRate: body.defaultRate !== undefined ? Number(body.defaultRate) : undefined,
        name: body.name,
        active: body.active
      }
    });

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: "Unable to update client" }, { status: 400 });
  }
}
