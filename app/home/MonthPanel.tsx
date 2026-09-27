"use client";

import { useMemo, useState } from "react";
import { toDateKey } from "@/lib/tasks";
import { WEEKDAY_SHORT } from "@/lib/themes";

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function buildMonthCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: Array<number | null> = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type MonthPanelProps = {
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
};

export default function MonthPanel({
  selectedDateKey,
  onSelectDate,
}: MonthPanelProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayKey = toDateKey();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden pt-2 pb-6 text-[#F8F6E7]">
      <div className="mb-6 flex gap-4">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          onClick={() =>
            setCursor(new Date(year, month - 1, 1))
          }
          className="font-zen border border-[#F8F6E7] px-3 py-1 text-sm shadow-[3px_3px_0_0_#49644E]"
        >
          ←
        </button>
        <h1 className="font-amatic text-5xl text-left font-bold tracking-wide">
          {MONTHS[month]} {year}
        </h1>
        <button
          type="button"
          aria-label="Следующий месяц"
          onClick={() =>
            setCursor(new Date(year, month + 1, 1))
          }
          className="font-zen border border-[#F8F6E7] px-3 py-1 text-sm shadow-[3px_3px_0_0_#49644E]"
        >
          →
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-7 gap-2">
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="font-zen py-2 text-center text-sm tracking-wide opacity-70"
          >
            {label.toUpperCase()}
          </div>
        ))}

        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = toDateKey(new Date(year, month, day));
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDateKey;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`font-zen flex aspect-square items-start justify-start border border-[#F8F6E7] p-2 text-left text-lg transition-colors hover:bg-[#F8F6E7]/10 ${
                isSelected ? "bg-[#F8F6E7]/15" : ""
              } ${isToday ? "ring-1 ring-[#49644E]" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
