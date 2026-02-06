"use client";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export function MonthSelector({
  month,
  year,
  onChange
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);

  return (
    <div className="flex flex-wrap gap-3">
      <label className="text-sm font-semibold">
        Month
        <select
          className="stable-input mt-2"
          value={month}
          onChange={(event) => onChange(Number(event.target.value), year)}
        >
          {months.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        Year
        <select
          className="stable-input mt-2"
          value={year}
          onChange={(event) => onChange(month, Number(event.target.value))}
        >
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
