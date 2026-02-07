"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, CircleOff, Trash2 } from "lucide-react";
import { MonthSelector } from "@/components/month-selector";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";

interface LessonLog {
  id: string;
  hours: number;
  totalOwed: number;
  paid: boolean;
  client: { name: string };
}

interface BoardingLog {
  id: string;
  totalOwed: number;
  paid: boolean;
  client: { name: string };
}

interface ExpenseLog {
  id: string;
  cost: number;
}

interface ActivityRow {
  id: string;
  name: string;
  hours: number | null;
  total: number;
  type: "Lesson" | "Boarding";
  paid: boolean;
}

export default function DashboardPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [lessons, setLessons] = useState<LessonLog[]>([]);
  const [boarding, setBoarding] = useState<BoardingLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLog[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    const load = async () => {
      const [lessonRes, boardingRes, expenseRes] = await Promise.all([
        fetch(`/api/lessons?month=${month}&year=${year}`),
        fetch(`/api/boarding?month=${month}&year=${year}`),
        fetch(`/api/expenses?month=${month}&year=${year}`)
      ]);

      if (lessonRes.ok) {
        setLessons(await lessonRes.json());
      }
      if (boardingRes.ok) {
        setBoarding(await boardingRes.json());
      }
      if (expenseRes.ok) {
        setExpenses(await expenseRes.json());
      }
    };
    load();
  }, [month, year]);

  const totalHours = useMemo(
    () => lessons.reduce((sum, entry) => sum + Number(entry.hours || 0), 0),
    [lessons]
  );

  const projectedRevenue = useMemo(() => {
    const lessonTotal = lessons.reduce((sum, entry) => sum + Number(entry.totalOwed || 0), 0);
    const boardingTotal = boarding.reduce((sum, entry) => sum + Number(entry.totalOwed || 0), 0);
    return lessonTotal + boardingTotal;
  }, [lessons, boarding]);

  const expenseTotal = useMemo(
    () => expenses.reduce((sum, entry) => sum + Number(entry.cost || 0), 0),
    [expenses]
  );

  const netProfit = useMemo(() => projectedRevenue - expenseTotal, [projectedRevenue, expenseTotal]);

  const activityRows = useMemo<ActivityRow[]>(() => {
    const lessonRows: ActivityRow[] = lessons.map((entry) => ({
      id: entry.id,
      name: entry.client.name,
      hours: entry.hours,
      total: entry.totalOwed,
      type: "Lesson",
      paid: entry.paid
    }));

    const boardingRows: ActivityRow[] = boarding.map((entry) => ({
      id: entry.id,
      name: entry.client.name,
      hours: null,
      total: entry.totalOwed,
      type: "Boarding",
      paid: entry.paid
    }));

    return [...lessonRows, ...boardingRows].sort((a, b) => a.name.localeCompare(b.name));
  }, [lessons, boarding]);

  const filteredRows = useMemo(() => {
    if (filter === "paid") {
      return activityRows.filter((row) => row.paid);
    }
    if (filter === "unpaid") {
      return activityRows.filter((row) => !row.paid);
    }
    return activityRows;
  }, [activityRows, filter]);

  const handleDelete = async (row: ActivityRow) => {
    const confirmed = window.confirm(`Delete this ${row.type.toLowerCase()} entry for ${row.name}?`);
    if (!confirmed) {
      return;
    }
    setStatus(null);
    const endpoint = row.type === "Lesson" ? `/api/lessons/${row.id}` : `/api/boarding/${row.id}`;
    const response = await fetch(endpoint, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Unable to delete entry.");
      return;
    }

    if (row.type === "Lesson") {
      setLessons((prev) => prev.filter((item) => item.id !== row.id));
    } else {
      setBoarding((prev) => prev.filter((item) => item.id !== row.id));
    }
    setStatus("Entry deleted.");
  };

  const handleTogglePaid = async (row: ActivityRow) => {
    setStatus(null);
    const endpoint = row.type === "Lesson" ? `/api/lessons/${row.id}` : `/api/boarding/${row.id}`;
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !row.paid })
    });
    if (!response.ok) {
      setStatus("Unable to update paid status.");
      return;
    }

    if (row.type === "Lesson") {
      setLessons((prev) => prev.map((item) => (item.id === row.id ? { ...item, paid: !row.paid } : item)));
    } else {
      setBoarding((prev) => prev.map((item) => (item.id === row.id ? { ...item, paid: !row.paid } : item)));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Monthly Dashboard"
        subtitle="Track total hours and projected revenue across lessons and boarding."
        action={<MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Hours" value={`${totalHours.toFixed(1)} hrs`} note="Riding lesson time logged." />
        <StatCard label="Projected Revenue" value={`€${projectedRevenue.toFixed(2)}`} note="Lessons + boarding for selected month." />
        <StatCard label="Expenses" value={`€${expenseTotal.toFixed(2)}`} note="Monthly costs logged in expenses." />
        <StatCard label="Net Profit" value={`€${netProfit.toFixed(2)}`} note="Revenue minus expenses for the month." />
      </div>

      <div className="mt-8 stable-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Monthly Activity</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-stable-saddle">
            <span>Name · Hours · Total</span>
            <select
              className="stable-input h-9 text-xs uppercase tracking-wide"
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
        {status ? <p className="mt-2 text-xs text-stable-forest">{status}</p> : null}
        <div className="mt-4 max-h-[60vh] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-stable-ink/60">
              <tr>
                <th className="pb-3">Client</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Hours</th>
                <th className="pb-3">Total Owed</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-stable-ink/60">
                    No activity logged for this month yet.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-stable-ink/10 ${row.paid ? "bg-green-100/70" : ""}`}
                  >
                    <td className="py-3 font-semibold">{row.name}</td>
                    <td className="py-3">{row.type}</td>
                    <td className="py-3">{row.hours ? row.hours.toFixed(1) : "-"}</td>
                    <td className="py-3 font-semibold">€{row.total.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="stable-button-secondary text-xs"
                          onClick={() => handleTogglePaid(row)}
                          title={row.paid ? "Mark as unpaid" : "Mark as paid"}
                        >
                          {row.paid ? <CircleOff className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          className="stable-button-secondary text-xs"
                          onClick={() => handleDelete(row)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
