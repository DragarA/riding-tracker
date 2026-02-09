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
  terrainRides: number;
  client: { name: string };
}

interface BoardingLog {
  id: string;
  totalOwed: number;
  paid: boolean;
  notes: string | null;
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
  terrainRides: number;
  notes: string | null;
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
  const [typeFilter, setTypeFilter] = useState<"all" | "lesson" | "boarding">("all");
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("shared-month-year");
    if (!saved) {
      setFiltersLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const savedMonth = Number(parsed?.month);
      const savedYear = Number(parsed?.year);
      if (Number.isFinite(savedMonth) && Number.isFinite(savedYear)) {
        setMonth(savedMonth);
        setYear(savedYear);
      }
    } catch {
      // ignore invalid storage
    }
    setFiltersLoaded(true);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "shared-month-year" || !event.newValue) {
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue);
        const savedMonth = Number(parsed?.month);
        const savedYear = Number(parsed?.year);
        if (Number.isFinite(savedMonth) && Number.isFinite(savedYear)) {
          setMonth(savedMonth);
          setYear(savedYear);
        }
      } catch {
        // ignore invalid storage
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!filtersLoaded) {
      return;
    }
    window.localStorage.setItem(
      "shared-month-year",
      JSON.stringify({ month, year })
    );
  }, [month, year, filtersLoaded]);

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

  const lessonRevenue = useMemo(
    () => lessons.reduce((sum, entry) => sum + Number(entry.totalOwed || 0), 0),
    [lessons]
  );

  const boardingRevenue = useMemo(
    () => boarding.reduce((sum, entry) => sum + Number(entry.totalOwed || 0), 0),
    [boarding]
  );

  const projectedRevenue = useMemo(() => lessonRevenue + boardingRevenue, [lessonRevenue, boardingRevenue]);

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
      terrainRides: entry.terrainRides ?? 0,
      notes: null,
      total: entry.totalOwed,
      type: "Lesson",
      paid: entry.paid
    }));

    const boardingRows: ActivityRow[] = boarding.map((entry) => ({
      id: entry.id,
      name: entry.client.name,
      hours: null,
      terrainRides: 0,
      notes: entry.notes ?? null,
      total: entry.totalOwed,
      type: "Boarding",
      paid: entry.paid
    }));

    return [...lessonRows, ...boardingRows].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "Lesson" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [lessons, boarding]);

  const filteredRows = useMemo(() => {
    let rows = activityRows;
    if (filter === "paid") {
      rows = rows.filter((row) => row.paid);
    } else if (filter === "unpaid") {
      rows = rows.filter((row) => !row.paid);
    }

    if (typeFilter === "lesson") {
      rows = rows.filter((row) => row.type === "Lesson");
    } else if (typeFilter === "boarding") {
      rows = rows.filter((row) => row.type === "Boarding");
    }
    return rows;
  }, [activityRows, filter, typeFilter]);

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
        <StatCard
          label="Projected Revenue"
          value={`€${projectedRevenue.toFixed(2)}`}
          note="Lessons + boarding for selected month."
          details={[
            `Lessons: €${lessonRevenue.toFixed(2)}`,
            `Boarders: €${boardingRevenue.toFixed(2)}`
          ]}
          detailsInline
          detailsClassName="font-semibold text-stable-ink"
        />
        <StatCard label="Expenses" value={`€${expenseTotal.toFixed(2)}`} note="Monthly costs logged in expenses." />
        <StatCard label="Net Profit" value={`€${netProfit.toFixed(2)}`} note="Revenue minus expenses for the month." />
      </div>

      <div className="mt-8 stable-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Monthly Activity</h3>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-stable-saddle">
            <select
              className="stable-input h-9 text-xs uppercase tracking-wide"
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <select
              className="stable-input h-9 min-w-[140px] text-xs uppercase tracking-wide"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            >
              <option value="all">All Types</option>
              <option value="lesson">Riders</option>
              <option value="boarding">Boarders</option>
            </select>
          </div>
        </div>
        {status ? <p className="mt-2 text-xs text-stable-forest">{status}</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-stable-ink/60">
              <tr>
                <th className="pb-3">Client</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Hours</th>
                <th className="pb-3">Notes</th>
                <th className="pb-3">Total Owed</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-stable-ink/60">
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
                    <td className="py-3">
                      {row.type === "Lesson" && row.hours !== null
                        ? row.terrainRides > 0
                          ? `${Math.round(row.hours)} hours + ${row.terrainRides} terrains`
                          : `${Math.round(row.hours)} hours`
                        : "-"}
                    </td>
                    <td className="py-3">{row.notes ? row.notes : "-"}</td>
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
