"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MonthSelector } from "@/components/month-selector";
import { SectionHeader } from "@/components/section-header";

interface Client {
  id: string;
  name: string;
  type: "RIDER" | "BOARDER";
  defaultRate: number;
  baseBoardingRate: number;
}

export default function RidersPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [hours, setHours] = useState("1");
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [rate, setRate] = useState("0");
  const [status, setStatus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("0");
  const [rateEdits, setRateEdits] = useState<Record<string, string>>({});
  const [rateStatus, setRateStatus] = useState<string | null>(null);
  const [editingRiderId, setEditingRiderId] = useState<string | null>(null);

  const riders = useMemo(() => clients.filter((client) => client.type === "RIDER"), [clients]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        if (!selectedId && data.length) {
          const firstRider = data.find((client: Client) => client.type === "RIDER");
          if (firstRider) {
            setSelectedId(firstRider.id);
            setRate(String(firstRider.defaultRate));
          }
        }
      }
    };
    load();
  }, [selectedId]);

  const selectedRider = riders.find((client) => client.id === selectedId);
  const computedTotal = Number(hours || 0) * Number(rate || 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!selectedId) {
      setStatus("Select a rider first.");
      return;
    }

    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedId,
        month,
        year,
        hours: Number(hours),
        rateAtTime: Number(rate)
      })
    });

    if (!response.ok) {
      setStatus("Unable to save lesson.");
      return;
    }

    setStatus("Lesson logged.");
    setHours("1");
  };

  const handleAddRider = async () => {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        type: "RIDER",
        defaultRate: Number(newRate),
        baseBoardingRate: 0,
        active: true
      })
    });

    if (response.ok) {
      const created = await response.json();
      setClients((prev) => [...prev, created]);
      setSelectedId(created.id);
      setRate(String(created.defaultRate));
      setNewName("");
      setNewRate("0");
      setShowModal(false);
    }
  };

  const handleDeleteRider = async (clientId: string) => {
    const rider = riders.find((client) => client.id === clientId);
    const confirmed = window.confirm(
      `Delete ${rider?.name ?? "this rider"}? Existing lesson records will remain.`
    );
    if (!confirmed) {
      return;
    }
    setRateStatus(null);
    const response = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false })
    });

    if (!response.ok) {
      setRateStatus("Unable to delete rider.");
      return;
    }

    setClients((prev) => prev.filter((client) => client.id !== clientId));
    setRateStatus("Rider removed.");
    if (selectedId === clientId) {
      setSelectedId("");
      setRate("0");
    }
  };

  const handleRateEdit = (clientId: string, value: string) => {
    setRateEdits((prev) => ({ ...prev, [clientId]: value }));
  };

  const handleSaveRate = async (clientId: string) => {
    const value = rateEdits[clientId];
    if (value === undefined) {
      return;
    }

    const response = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultRate: Number(value) })
    });

    if (!response.ok) {
      setRateStatus("Unable to update rate.");
      return;
    }

    const updated = await response.json();
    setClients((prev) => prev.map((client) => (client.id === clientId ? updated : client)));
    setRateStatus("Rate updated.");
    setEditingRiderId(null);
    setRateEdits((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  };

  return (
    <div>
      <SectionHeader
        title="Rider Input"
        subtitle="Log lesson hours by month and capture the rate at time of service."
        action={<MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form onSubmit={handleSubmit} className="stable-card p-6">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-semibold">
              Rider
              <div className="mt-2 flex gap-2">
                <select
                  className="stable-input"
                  value={selectedId}
                  onChange={(event) => {
                    setSelectedId(event.target.value);
                    const rider = riders.find((client) => client.id === event.target.value);
                    if (rider) {
                      setRate(String(rider.defaultRate));
                    }
                  }}
                >
                  <option value="">Select rider</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="stable-button-secondary"
                  onClick={() => setShowModal(true)}
                >
                  + Add
                </button>
              </div>
            </label>

            <label className="text-sm font-semibold">
              Hours
              <input
                type="number"
                min="0"
                step="0.25"
                className="stable-input mt-2"
                value={hours}
                onChange={(event) => setHours(event.target.value)}
              />
            </label>

            <label className="text-sm font-semibold">
              Rate (Editable)
              <input
                type="number"
                min="0"
                step="1"
                className="stable-input mt-2"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
              {selectedRider ? (
                <p className="mt-2 text-xs text-stable-ink/60">
                  Default rate: ${selectedRider.defaultRate.toFixed(2)}
                </p>
              ) : null}
            </label>

            <div className="rounded-md bg-stable-hay/20 p-4">
              <p className="text-xs uppercase tracking-wide text-stable-saddle">Auto Calculation</p>
              <p className="mt-2 text-xl font-semibold">${computedTotal.toFixed(2)}</p>
            </div>

            {status ? <p className="text-sm text-stable-forest">{status}</p> : null}

            <button type="submit" className="stable-button w-full">
              Save Lesson Entry
            </button>
          </div>
        </form>

        <div className="stable-card p-6">
          <h3 className="text-lg font-semibold">Rider Snapshot</h3>
          <p className="mt-2 text-sm text-stable-ink/70">
            Active riders: {riders.length}
          </p>
          {rateStatus ? <p className="mt-2 text-xs text-stable-forest">{rateStatus}</p> : null}
          <ul className="mt-4 space-y-2 text-sm">
            {riders.map((rider) => (
              <li key={rider.id} className="border-b border-stable-ink/10 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{rider.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="stable-button-secondary flex items-center gap-1 text-xs"
                      onClick={() => {
                        setEditingRiderId((prev) => (prev === rider.id ? null : rider.id));
                        setRateEdits((prev) => ({
                          ...prev,
                          [rider.id]: prev[rider.id] ?? String(rider.defaultRate)
                        }));
                      }}
                      aria-label={`Edit rate for ${rider.name}`}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="stable-button-secondary flex items-center gap-1 text-xs"
                      onClick={() => handleDeleteRider(rider.id)}
                      aria-label={`Delete ${rider.name}`}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
                {editingRiderId === rider.id ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="stable-input"
                      value={rateEdits[rider.id] ?? rider.defaultRate}
                      onChange={(event) => handleRateEdit(rider.id, event.target.value)}
                    />
                    <span className="text-xs text-stable-ink/60">$/hr</span>
                    <button
                      type="button"
                      className="stable-button-secondary text-xs"
                      onClick={() => handleSaveRate(rider.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="stable-button-secondary text-xs"
                      onClick={() => setEditingRiderId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-stable-ink/70">
                    ${rider.defaultRate.toFixed(2)} / hr
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className="stable-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold">Add Rider</h3>
            <div className="mt-4 space-y-4">
              <label className="text-sm font-semibold">
                Rider Name
                <input
                  type="text"
                  className="stable-input mt-2"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                />
              </label>
              <label className="text-sm font-semibold">
                Default Hourly Rate
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
              <button className="stable-button" type="button" onClick={handleAddRider}>
                Save Rider
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
