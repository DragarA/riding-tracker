import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    const where = Number.isFinite(month) && Number.isFinite(year)
      ? { month, year }
      : {};

    const lessons = await prisma.lessonLog.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(lessons);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    const hours = Number(body.hours ?? 0);
    const rateAtTime = Number(body.rateAtTime ?? 0);
    const totalOwed = Number((hours * rateAtTime).toFixed(2));
    const month = Number(body.month);
    const year = Number(body.year);
    const now = new Date();
    const resolvedMonth = Number.isFinite(month) ? month : now.getMonth() + 1;
    const resolvedYear = Number.isFinite(year) ? year : now.getFullYear();

    const lesson = await prisma.lessonLog.create({
      data: {
        clientId: body.clientId,
        hours,
        rateAtTime,
        totalOwed,
        month: resolvedMonth,
        year: resolvedYear
      },
      include: { client: true }
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to save lesson" }, { status: 400 });
  }
}
