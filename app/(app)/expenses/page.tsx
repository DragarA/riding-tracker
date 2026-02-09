"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthSelector } from "@/components/month-selector";
import { SectionHeader } from "@/components/section-header";

interface Expense {
  id: string;
  date: string;
  description: string;
  cost: number;
}

function toDisplayDate(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}.${month}.${year}`;
}

function parseDisplayDate(value: string) {
  const [day, month, year] = value.split(".").map((part) => Number(part));
  if (!day || !month || !year) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function ExpensesPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [date, setDate] = useState(toDisplayDate(today));
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("0");
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
      const response = await fetch(`/api/expenses?month=${month}&year=${year}`);
      if (response.ok) {
        setExpenses(await response.json());
      }
    };
    load();
  }, [month, year]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.cost || 0), 0),
    [expenses]
  );

  const fetchExpenses = async () => {
    const response = await fetch(`/api/expenses?month=${month}&year=${year}`);
    if (response.ok) {
      setExpenses(await response.json());
    }
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const parsedDate = parseDisplayDate(date);
    if (!parsedDate) {
      setStatus("Use date format dd.MM.yyyy.");
      return;
    }

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        description,
        cost: Number(cost || 0)
      })
    });

    if (!response.ok) {
      setStatus("Unable to save expense.");
      return;
    }

    await response.json();
    await fetchExpenses();
    setDescription("");
    setCost("0");
    setStatus("Expense added.");
  };

  const handleDelete = async (expense: Expense) => {
    const confirmed = window.confirm(`Delete expense "${expense.description}"?`);
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Unable to delete expense.");
      return;
    }

    await fetchExpenses();
    setStatus("Expense deleted.");
  };

  return (
    <div>
      <SectionHeader
        title="Expenses"
        subtitle="Track monthly expenses alongside lesson and boarding revenue."
        action={<MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1.8fr]">
        <form onSubmit={handleAdd} className="stable-card self-start p-6">
          <h3 className="text-lg font-semibold">Add Expense</h3>
          <div className="mt-4 flex flex-col gap-4">
            <label className="text-sm font-semibold">
              Date
              <input
                type="text"
                className="stable-input mt-2"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                placeholder="dd.MM.yyyy"
                required
              />
            </label>
            <label className="text-sm font-semibold">
              Description
              <input
                type="text"
                className="stable-input mt-2"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-semibold">
              Cost
              <input
                type="number"
                step="0.01"
                className="stable-input mt-2"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
              />
            </label>
            {status ? <p className="text-sm text-stable-forest">{status}</p> : null}
            <button type="submit" className="stable-button w-full">
              Save Expense
            </button>
          </div>
        </form>

        <div className="stable-card p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Monthly Expenses</h3>
            <p className="text-sm text-stable-ink/70">Total: €{totalExpenses.toFixed(2)}</p>
          </div>
        <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stable-ink/60">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Cost</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-stable-ink/60">
                      No expenses logged for this month yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-stable-ink/10">
                      <td className="py-3">
                        {toDisplayDate(new Date(expense.date))}
                      </td>
                      <td className="py-3 font-semibold">{expense.description}</td>
                      <td className="py-3">€{Number(expense.cost).toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          className="stable-button-secondary text-xs"
                          onClick={() => handleDelete(expense)}
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
    </div>
  );
}
