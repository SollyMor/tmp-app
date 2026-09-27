"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { WEEKDAY_SHORT } from "@/lib/themes";

export type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  room: string;
  color: string;
  weekday: number;
  sortKey: number;
};

const COLORS = [
  "#E57373",
  "#FFD54F",
  "#81C784",
  "#4DB6AC",
  "#64B5F6",
  "#9575CD",
  "#F48FB1",
  "#EF5350",
  "#9E9D24",
  "#90A4AE",
];

const inputClassName =
  "h-9 w-full rounded-[3px] border border-[#F8F6E7] bg-transparent px-2 text-[#F8F6E7] focus:border-[#49644E] focus:outline-none";

type ScheduleEditorProps = {
  open: boolean;
  initialWeekday?: number;
  onClose: () => void;
  onChanged?: () => void;
};

export default function ScheduleEditor({
  open,
  initialWeekday = 0,
  onClose,
  onChanged,
}: ScheduleEditorProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [weekday, setWeekday] = useState(initialWeekday);
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    const response = await fetch("/api/schedule");
    const data = await response.json();
    if (response.ok) setItems(data.items ?? []);
  }

  useEffect(() => {
    if (!open) return;
    setWeekday(initialWeekday);
    void loadItems();
  }, [open, initialWeekday]);

  const dayItems = useMemo(
    () =>
      items
        .filter((item) => item.weekday === weekday)
        .sort((a, b) => a.sortKey - b.sortKey),
    [items, weekday],
  );

  function resetForm() {
    setTime("");
    setTitle("");
    setRoom("");
    setColor(COLORS[0]);
    setError("");
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time, title, room, color, weekday }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      setItems((prev) => [...prev, data.item]);
      resetForm();
      onChanged?.();
    } catch {
      setError("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    onChanged?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex h-[min(520px,90vh)] w-full max-w-3xl overflow-hidden rounded-[4px] border border-[#F8F6E7] bg-[#191919] text-[#F8F6E7]">
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#F8F6E7] text-lg leading-none"
        >
          ×
        </button>

        <div className="flex w-full flex-col p-5 pt-4">
          <div className="mb-4 flex flex-wrap gap-2 pr-10">
            {WEEKDAY_SHORT.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setWeekday(index)}
                className={`font-zen h-10 w-10 border text-sm ${
                  weekday === index
                    ? "border-[#F8F6E7] bg-[#49644E]"
                    : "border-[#F8F6E7] bg-transparent"
                }`}
              >
                {label.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-0">
            <form
              onSubmit={handleCreate}
              className="flex flex-col gap-3 border-r border-[#F8F6E7] pr-5"
            >
              <label className="flex flex-col gap-1">
                <span className="font-zen text-sm">Время</span>
                <input
                  className={inputClassName}
                  placeholder="9:00-10:50"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-zen text-sm">Название предмета</span>
                <input
                  className={inputClassName}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-zen text-sm">Место</span>
                <input
                  className={inputClassName}
                  value={room}
                  onChange={(event) => setRoom(event.target.value)}
                  required
                />
              </label>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    className={`h-8 w-8 rounded-[4px] border-2 ${
                      color === swatch ? "border-[#F8F6E7]" : "border-transparent"
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>

              {error ? (
                <p className="font-zen text-sm text-red-400">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="mt-auto flex h-10 w-10 items-center justify-center border border-[#F8F6E7] text-xl disabled:opacity-50"
              >
                ✓
              </button>
            </form>

            <div className="min-h-0 overflow-y-auto pl-5">
              {dayItems.length === 0 ? (
                <p className="font-zen text-sm opacity-50">Пока пусто</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dayItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <span className="font-zen w-24 shrink-0 text-sm">
                        {item.time}
                      </span>
                      <div
                        className="relative flex min-w-0 flex-1 items-center justify-between rounded-full px-4 py-2"
                        style={{ backgroundColor: item.color }}
                      >
                        <span className="font-zen truncate text-sm text-[#191919]">
                          {item.title}
                        </span>
                        <span className="font-zen ml-2 shrink-0 text-sm text-[#191919]">
                          {item.room}
                        </span>
                        <button
                          type="button"
                          aria-label="Удалить"
                          onClick={() => void handleDelete(item.id)}
                          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#F8F6E7] text-xs text-[#191919]"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
