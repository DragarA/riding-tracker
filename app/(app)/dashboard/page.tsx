"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthSelector } from "@/components/month-selector";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";

interface LessonLog {
  id: string;
  hours: number;
  totalOwed: number;
  client: { name: string };
}

interface BoardingLog {
  id: string;
  totalOwed: number;
  client: { name: string };
}

interface ActivityRow {
  id: string;
  name: string;
  hours: number | null;
  total: number;
  type: "Lesson" | "Boarding";
}

export default function DashboardPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [lessons, setLessons] = useState<LessonLog[]>([]);
  const [boarding, setBoarding] = useState<BoardingLog[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [lessonRes, boardingRes] = await Promise.all([
        fetch(`/api/lessons?month=${month}&year=${year}`),
        fetch(`/api/boarding?month=${month}&year=${year}`)
      ]);

      if (lessonRes.ok) {
        setLessons(await lessonRes.json());
      }
      if (boardingRes.ok) {
        setBoarding(await boardingRes.json());
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

  const activityRows = useMemo<ActivityRow[]>(() => {
    const lessonRows: ActivityRow[] = lessons.map((entry) => ({
      id: entry.id,
      name: entry.client.name,
      hours: entry.hours,
      total: entry.totalOwed,
      type: "Lesson"
    }));

    const boardingRows: ActivityRow[] = boarding.map((entry) => ({
      id: entry.id,
      name: entry.client.name,
      hours: null,
      total: entry.totalOwed,
      type: "Boarding"
    }));

    return [...lessonRows, ...boardingRows].sort((a, b) => a.name.localeCompare(b.name));
  }, [lessons, boarding]);

  const handleDelete = async (row: ActivityRow) => {
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

  return (
    <div>
      <SectionHeader
        title="Monthly Dashboard"
        subtitle="Track total hours and projected revenue across lessons and boarding."
        action={<MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Hours" value={`${totalHours.toFixed(1)} hrs`} note="Riding lesson time logged." />
        <StatCard label="Projected Revenue" value={`$${projectedRevenue.toFixed(2)}`} note="Lessons + boarding for selected month." />
      </div>

      <div className="mt-8 stable-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Monthly Activity</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-stable-saddle">Name · Hours · Total</p>
        </div>
        {status ? <p className="mt-2 text-xs text-stable-forest">{status}</p> : null}
        <div className="mt-4 overflow-x-auto">
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
              {activityRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-stable-ink/60">
                    No activity logged for this month yet.
                  </td>
                </tr>
              ) : (
                activityRows.map((row) => (
                  <tr key={row.id} className="border-t border-stable-ink/10">
                    <td className="py-3 font-semibold">{row.name}</td>
                    <td className="py-3">{row.type}</td>
                    <td className="py-3">{row.hours ? row.hours.toFixed(1) : "-"}</td>
                    <td className="py-3 font-semibold">${row.total.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="stable-button-secondary text-xs"
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </button>
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
