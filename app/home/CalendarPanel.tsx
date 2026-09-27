"use client";

import { useMemo, useState } from "react";
import { toDateKey } from "@/lib/tasks";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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

type CalendarPanelProps = {
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
};

export default function CalendarPanel({
  selectedDateKey,
  onSelectDate,
}: CalendarPanelProps) {
  const [cursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayKey = toDateKey();

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-[6px] px-3 py-3 text-[#F8F6E7]">
      <p className="font-zen text-center text-lg leading-none text-[#F8F6E7]">
        {MONTHS[month]} {year}
      </p>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAYS.map((label) => (
          <span
            key={label}
            className="font-zen text-xs leading-none text-[#F8F6E7]/55"
          >
            {label}
          </span>
        ))}

        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} className="h-8" />;
          }

          const dateKey = toDateKey(new Date(year, month, day));
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDateKey;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`font-zen flex h-8 items-center justify-center text-base leading-none transition-colors hover:bg-[#F8F6E7]/10 ${
                isSelected
                  ? "rounded-full border-2 border-[#F8F6E7] font-semibold"
                  : isToday
                    ? "rounded-full border border-[#F8F6E7]/40"
                    : "rounded-full"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
