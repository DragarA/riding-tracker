"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthSelector } from "@/components/month-selector";
import { SectionHeader } from "@/components/section-header";
import { Trash2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  type: "RIDER" | "BOARDER";
  baseBoardingRate: number;
}

interface BoardingLog {
  clientId: string;
  totalOwed: number;
}

interface EntryState {
  clientId: string;
  baseRateAtTime: number;
  additionalFees: number;
  notes: string;
}

export default function BoardersPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [clients, setClients] = useState<Client[]>([]);
  const [existing, setExisting] = useState<BoardingLog[]>([]);
  const [entries, setEntries] = useState<EntryState[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("0");
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
      const clientRes = await fetch("/api/clients");
      const boardingRes = await fetch(`/api/boarding?month=${month}&year=${year}`);

      if (clientRes.ok) {
        const data = await clientRes.json();
        setClients(data);
      }

      if (boardingRes.ok) {
        const data = await boardingRes.json();
        setExisting(data);
      }
    };

    load();
  }, [month, year]);

  useEffect(() => {
    const boarders = clients.filter((client) => client.type === "BOARDER");
    setEntries(
      boarders.map((client) => ({
        clientId: client.id,
        baseRateAtTime: client.baseBoardingRate,
        additionalFees: 0,
        notes: ""
      }))
    );
  }, [clients]);

  const billedClientIds = useMemo(
    () => new Set(existing.map((entry) => entry.clientId)),
    [existing]
  );

  const handleUpdate = (clientId: string, field: keyof EntryState, value: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.clientId === clientId
          ? {
              ...entry,
              [field]: field === "notes" ? value : Number(value)
            }
          : entry
      )
    );
  };

  const totalProjected = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.baseRateAtTime + entry.additionalFees, 0);
  }, [entries]);

  const handleCommit = async () => {
    setStatus(null);
    const payload = entries
      .filter((entry) => !billedClientIds.has(entry.clientId))
      .map((entry) => ({
        ...entry,
        month,
        year
      }));

    if (payload.length === 0) {
      setStatus("All boarders already billed for this month.");
      return;
    }

    const response = await fetch("/api/boarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: payload })
    });

    if (!response.ok) {
      setStatus("Unable to commit boarding billing.");
      return;
    }

    setStatus("Boarding entries committed.");
  };

  const handleAddBoarder = async () => {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        type: "BOARDER",
        defaultRate: 0,
        baseBoardingRate: Number(newRate),
        active: true
      })
    });

    if (response.ok) {
      const created = await response.json();
      setClients((prev) => [...prev, created]);
      setNewName("");
      setNewRate("0");
      setShowModal(false);
    }
  };

  const handleDeleteBoarder = async (clientId: string) => {
    const boarder = boarders.find((client) => client.id === clientId);
    const confirmed = window.confirm(
      `Delete ${boarder?.name ?? "this boarder"}? Existing boarding records will remain.`
    );
    if (!confirmed) {
      return;
    }
    setStatus(null);
    const response = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false })
    });

    if (!response.ok) {
      setStatus("Unable to delete boarder.");
      return;
    }

    setClients((prev) => prev.filter((client) => client.id !== clientId));
    setStatus("Boarder removed.");
  };

  const boarders = clients.filter((client) => client.type === "BOARDER");

  return (
    <div>
      <SectionHeader
        title="Boarder Batch Billing"
        subtitle="Pre-fill monthly boarding rates and commit all entries in one step."
        action={(
          <div className="flex flex-wrap gap-3">
            <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
            <button className="stable-button-secondary" type="button" onClick={() => setShowModal(true)}>
              + Add Boarder
            </button>
          </div>
        )}
      />

      <div className="stable-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Monthly Boarders</h3>
          <p className="text-sm text-stable-ink/70">Projected: €{totalProjected.toFixed(2)}</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-stable-ink/60">
              <tr>
                <th className="pb-3">Boarder</th>
                <th className="pb-3">Base Rate</th>
                <th className="pb-3">Additional Fees</th>
                <th className="pb-3">Notes</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {boarders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-stable-ink/60">
                    No boarders added yet.
                  </td>
                </tr>
              ) : (
                boarders.map((client) => {
                  const entry = entries.find((item) => item.clientId === client.id);
                  const isBilled = billedClientIds.has(client.id);

                  return (
                    <tr key={client.id} className="border-t border-stable-ink/10">
                      <td className="py-3 font-semibold">{client.name}</td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="stable-input"
                          value={entry?.baseRateAtTime ?? client.baseBoardingRate}
                          onChange={(event) => handleUpdate(client.id, "baseRateAtTime", event.target.value)}
                          disabled={isBilled}
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          step="1"
                          className="stable-input"
                          value={entry?.additionalFees ?? 0}
                          onChange={(event) => handleUpdate(client.id, "additionalFees", event.target.value)}
                          disabled={isBilled}
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="text"
                          className="stable-input"
                          value={entry?.notes ?? ""}
                          onChange={(event) => handleUpdate(client.id, "notes", event.target.value)}
                          disabled={isBilled}
                        />
                      </td>
                      <td className="py-3 text-sm">
                        {isBilled ? "Already billed" : "Pending"}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          className="stable-button-secondary inline-flex items-center gap-1 text-xs"
                          onClick={() => handleDeleteBoarder(client.id)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {status ? <p className="mt-4 text-sm text-stable-forest">{status}</p> : null}

        <button className="stable-button mt-6 w-full" type="button" onClick={handleCommit}>
          Commit Monthly Billing
        </button>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className="stable-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold">Add Boarder</h3>
            <div className="mt-4 space-y-4">
              <label className="text-sm font-semibold">
                Boarder Name
                <input
                  type="text"
                  className="stable-input mt-2"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                />
              </label>
              <label className="text-sm font-semibold">
                Base Monthly Rate
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="stable-input mt-2"
                  value={newRate}
                  onChange={(event) => setNewRate(event.target.value)}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="stable-button-secondary" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="stable-button" type="button" onClick={handleAddBoarder}>
                Save Boarder
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
