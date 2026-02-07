import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

function getMonthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    const range = Number.isFinite(month) && Number.isFinite(year)
      ? getMonthRange(month, year)
      : null;
    const where = range
      ? {
          date: {
            gte: range.start,
            lt: range.end
          }
        }
      : {};

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" }
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    const dateInput = String(body.date || "");
    const [day, month, year] = dateInput.split(".").map((part: string) => Number(part));
    const date = day && month && year
      ? new Date(Date.UTC(year, month - 1, day))
      : new Date();
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid expense date" }, { status: 400 });
    }
    const cost = Number(body.cost ?? 0);
    if (!Number.isFinite(cost)) {
      return NextResponse.json({ error: "Invalid expense cost" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        date,
        description: String(body.description ?? ""),
        cost
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expense create failed:", error);
    return NextResponse.json({ error: "Unable to save expense" }, { status: 400 });
  }
}
