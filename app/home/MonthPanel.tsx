"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

type MonthEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
};

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

function isWeekendColumn(index: number) {
  const col = index % 7;
  return col === 5 || col === 6;
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
  const [events, setEvents] = useState<MonthEvent[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00");
  const [date, setDate] = useState(selectedDateKey);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayKey = toDateKey();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/meetings");
      const data = await response.json();
      if (response.ok) {
        setEvents(
          (data.meetings ?? []).map(
            (item: { id: string; date: string; time: string; title: string }) => ({
              id: item.id,
              date: item.date,
              time: item.time,
              title: item.title,
            }),
          ),
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (formOpen) setDate(selectedDateKey);
  }, [formOpen, selectedDateKey]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, MonthEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, title }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Не удалось создать событие");
        return;
      }
      setTitle("");
      setTime("12:00");
      setFormOpen(false);
      await loadEvents();
    } catch {
      setError("Не удалось создать событие");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden px-8 pt-6 pb-6 text-[#F8F6E7]">
      <div className="mb-6 flex w-full max-w-4xl items-center gap-4">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="font-zen flex h-10 w-10 shrink-0 items-center justify-center border border-[#F8F6E7] text-sm shadow-[3px_3px_0_0_#49644E]"
        >
          ←
        </button>
        <h1 className="font-amatic text-5xl font-bold tracking-wide uppercase">
          {MONTHS[month]} {year}
        </h1>
        <button
          type="button"
          aria-label="Следующий месяц"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="font-zen flex h-10 w-10 shrink-0 items-center justify-center border border-[#F8F6E7] text-sm shadow-[3px_3px_0_0_#49644E]"
        >
          →
        </button>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="font-zen ml-auto border border-[#F8F6E7] bg-[#F8F6E7] px-4 py-2 text-sm text-[#191919] shadow-[3px_3px_0_0_#49644E] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#49644E]"
        >
          Создать событие
        </button>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-7 gap-2">
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
          const weekend = isWeekendColumn(index);
          const dayEvents = eventsByDate.get(dateKey) ?? [];

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`font-zen flex aspect-square flex-col items-start justify-start gap-1 border border-[#F8F6E7] p-2 text-left text-lg transition-colors hover:bg-[#F8F6E7]/10 ${
                weekend ? "bg-[#F8F6E7]/8" : ""
              } ${isSelected ? "bg-[#F8F6E7]/15" : ""} ${
                isToday ? "ring-1 ring-[#49644E]" : ""
              }`}
            >
              <span>{day}</span>
              {dayEvents.slice(0, 2).map((item) => (
                <span
                  key={item.id}
                  className="w-full truncate text-[10px] leading-tight opacity-80"
                  title={`${item.time} ${item.title}`}
                >
                  {item.title}
                </span>
              ))}
              {dayEvents.length > 2 ? (
                <span className="text-[10px] opacity-60">
                  +{dayEvents.length - 2}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {formOpen ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 mt-2">
          <form
            onSubmit={handleCreate}
            className="mt-1 flex w-full max-w-sm flex-col gap-3 rounded-[3px] border border-[#F8F6E7] bg-[#191919] p-5 pt-6 shadow-[6px_6px_0_0_#49644E]"
          >
            <h2 className="font-amatic text-3xl font-bold">Новое событие</h2>
            <label className="font-zen flex flex-col gap-1 text-sm">
              Дата
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-[#F8F6E7] bg-[#191919] px-3 py-2 text-[#F8F6E7] outline-none focus:border-[#49644E]"
                required
              />
            </label>
            <label className="font-zen flex flex-col gap-1 text-sm">
              Название
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="День рождение"
                className="border border-[#F8F6E7] bg-[#191919] px-3 py-2 text-[#F8F6E7] outline-none focus:border-[#49644E]"
                required
              />
            </label>
            <label className="font-zen flex flex-col gap-1 text-sm">
              Время
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="12:00"
                className="border border-[#F8F6E7] bg-[#191919] px-3 py-2 text-[#F8F6E7] outline-none focus:border-[#49644E]"
                required
              />
            </label>
            {error ? (
              <p className="font-zen text-sm text-red-400">{error}</p>
            ) : null}
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setError("");
                }}
                className="font-zen flex-1 border border-[#F8F6E7] px-3 py-2 text-sm"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="font-zen flex-1 border border-[#F8F6E7] bg-[#F8F6E7] px-3 py-2 text-sm text-[#191919] disabled:opacity-60"
              >
                {saving ? "..." : "Создать"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
