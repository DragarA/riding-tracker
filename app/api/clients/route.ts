import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const clients = await prisma.client.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        type: body.type,
        defaultRate: Number(body.defaultRate ?? 0),
        baseBoardingRate: Number(body.baseBoardingRate ?? 0),
        active: body.active ?? true
      }
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create client" }, { status: 400 });
  }
}
