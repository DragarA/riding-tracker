import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

interface BoardingEntry {
  clientId: string;
  month: number;
  year: number;
  baseRateAtTime?: number;
  additionalFees?: number;
  notes?: string | null;
}

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    const where = Number.isFinite(month) && Number.isFinite(year)
      ? { month, year }
      : {};

    const boarding = await prisma.boardingLog.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(boarding);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    const entries: BoardingEntry[] = Array.isArray(body.entries) ? body.entries : [];

    const created = await prisma.$transaction(
      entries.map((entry: BoardingEntry) => {
        const baseRateAtTime = Number(entry.baseRateAtTime ?? 0);
        const additionalFees = Number(entry.additionalFees ?? 0);
        const totalOwed = Number((baseRateAtTime + additionalFees).toFixed(2));
        return prisma.boardingLog.create({
          data: {
            clientId: entry.clientId,
            month: Number(entry.month),
            year: Number(entry.year),
            baseRateAtTime,
            additionalFees,
            notes: entry.notes || null,
            totalOwed
          },
          include: { client: true }
        });
      })
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to commit boarding" }, { status: 400 });
  }
}
