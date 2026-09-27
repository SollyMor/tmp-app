"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addDays,
  formatTaskDeadline,
  toDateKey,
} from "@/lib/tasks";
import { getTheme, TASK_THEMES } from "@/lib/themes";
import { PriorityBars } from "./PriorityBars";

type Task = {
  id: string;
  title: string;
  description: string;
  time: string;
  startDate: string;
  endDate: string;
  priority: number;
  themeId: string;
  completed: boolean;
};

const inputClassName =
  "h-10 w-full rounded-[3px] border border-[#F8F6E7] bg-[#191919] p-2 text-[#F8F6E7] transition-all duration-200 focus:border-[#49644E] focus:outline-none focus:shadow-[4px_4px_0_0_#49644E]";

const taskGridClass =
  "grid grid-cols-[1.25rem_minmax(0,1fr)_1.5rem_4.5rem_5.5rem] items-center gap-x-3";

type StatusFilter = "open" | "done";
type ModalMode = "create" | "edit";

function ThemeTag({ themeId }: { themeId: string }) {
  const theme = getTheme(themeId);
  return (
    <span
      className="font-zen inline-flex min-w-[4.5rem] justify-center rounded-full px-2 py-0.5 text-xs whitespace-nowrap text-[#F8F6E7]"
      style={{ backgroundColor: theme.color }}
    >
      {theme.label}
    </span>
  );
}

export default function AllTasksPanel() {
  const todayKey = toDateKey();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState(todayKey);
  const [priority, setPriority] = useState(1);
  const [themeId, setThemeId] = useState<string>(TASK_THEMES[0].id);

  async function loadTasks() {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks");
      const data = await response.json();
      if (response.ok) setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const filtered = useMemo(() => {
    return tasks
      .filter((task) =>
        statusFilter === "done" ? task.completed : !task.completed,
      )
      .filter((task) =>
        themeFilter === "all" ? true : task.themeId === themeFilter,
      )
      .sort((a, b) => {
        if (a.endDate !== b.endDate) return a.endDate.localeCompare(b.endDate);
        return b.priority - a.priority;
      });
  }, [tasks, statusFilter, themeFilter]);

  function resetForm(defaults?: Partial<Task>) {
    setTitle(defaults?.title ?? "");
    setDescription(defaults?.description ?? "");
    setTime(defaults?.time ?? "");
    setStartDate(defaults?.startDate ?? todayKey);
    setEndDate(defaults?.endDate ?? defaults?.startDate ?? todayKey);
    setPriority(defaults?.priority ?? 1);
    setThemeId(defaults?.themeId ?? TASK_THEMES[0].id);
    setError("");
  }

  function openCreate() {
    setModalMode("create");
    setEditingId(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setModalMode("edit");
    setEditingId(task.id);
    resetForm(task);
    setModalOpen(true);
  }

  function handleTitleClick(task: Task) {
    if (editing) {
      openEdit(task);
      return;
    }
    if (task.description?.trim()) setDetailTask(task);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const payload = { title, description, time, startDate, endDate, priority, themeId };

    try {
      const response = await fetch(
        modalMode === "create" ? "/api/tasks" : `/api/tasks/${editingId}`,
        {
          method: modalMode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Ошибка сохранения");
        return;
      }
      if (modalMode === "create") {
        setTasks((prev) => [...prev, data.task]);
      } else {
        setTasks((prev) =>
          prev.map((task) => (task.id === data.task.id ? data.task : task)),
        );
      }
      setModalOpen(false);
      resetForm();
    } catch {
      setError("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCompleted(task: Task) {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const data = await response.json();
    if (!response.ok) return;
    setTasks((prev) =>
      prev.map((item) => (item.id === data.task.id ? data.task : item)),
    );
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (editingId === id) {
      setModalOpen(false);
      setEditingId(null);
    }
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden px-8 pt-11 pb-6 text-[#F8F6E7]">
      <h1 className="font-amatic mb-4 shrink-0 text-5xl font-bold tracking-wide uppercase">
        Задания
      </h1>

      <div className="mb-3 flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setThemeFilter("all")}
          className={`font-zen rounded-full border px-3 py-1 text-xs ${
            themeFilter === "all"
              ? "border-[#F8F6E7] bg-[#F8F6E7] text-[#191919]"
              : "border-[#F8F6E7]/40 text-[#F8F6E7]"
          }`}
        >
          все темы
        </button>
        {TASK_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setThemeFilter(theme.id)}
            className={`font-zen rounded-full px-3 py-1 text-xs text-[#F8F6E7] ${
              themeFilter === theme.id
                ? "ring-2 ring-[#F8F6E7] ring-offset-1 ring-offset-[#191919]"
                : "opacity-80"
            }`}
            style={{ backgroundColor: theme.color }}
          >
            {theme.label}
          </button>
        ))}
      </div>

      <div className="flex h-[70%] min-h-0 w-[90%] flex-col">
        <div className="mb-1 flex shrink-0 items-center gap-3 border-b border-[#F8F6E7] pb-2">
          <h2 className="font-zen text-[20px]">
            {statusFilter === "done" ? "Сделанные" : "Не выполненные"}
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={statusFilter === "done"}
            aria-label="Показать сделанные"
            onClick={() =>
              setStatusFilter((value) => (value === "open" ? "done" : "open"))
            }
            className={`relative ml-1 h-5 w-9 shrink-0 rounded-full border border-[#F8F6E7] transition-colors ${
              statusFilter === "done" ? "bg-[#49644E]" : "bg-transparent"
            }`}
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[#F8F6E7] transition-transform ${
                statusFilter === "done" ? "left-4" : "left-0.5"
              }`}
            />
          </button>
          <div className={`${taskGridClass} ml-auto w-[min(100%,28rem)] pr-1`}>
            <span />
            <span />
            <span className="font-zen text-center text-[14px] opacity-50">
              приор.
            </span>
            <span className="font-zen text-center text-[14px] opacity-50">
              срок
            </span>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                aria-label={editing ? "Закрыть редактирование" : "Редактировать"}
                onClick={() => {
                  setEditing((value) => !value);
                  setModalOpen(false);
                }}
                className={`rounded-[3px] p-0.5 transition-opacity ${
                  editing ? "opacity-100" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src="/pen-tool.svg" alt="" width={20} height={20} />
              </button>
              <button
                type="button"
                aria-label="Добавить задачу"
                onClick={openCreate}
                className="rounded-[3px] p-0.5 opacity-70 transition-opacity hover:opacity-100"
              >
                <Image src="/plus.svg" alt="" width={20} height={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="font-zen text-sm opacity-60">Загрузка...</p>
          ) : filtered.length === 0 ? (
            <p className="font-zen mt-3 text-sm opacity-50">Пока пусто</p>
          ) : (
            <ul>
              {filtered.map((task) => (
                <li key={task.id} className={`${taskGridClass} py-2`}>
                  <button
                    type="button"
                    aria-label={task.completed ? "Снять выполнение" : "Выполнить"}
                    onClick={() => void toggleCompleted(task)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border-2 border-[#F8F6E7] text-xs text-[#F8F6E7]"
                  >
                    {task.completed ? "✓" : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTitleClick(task)}
                    className={`font-zen min-w-0 truncate text-left text-base text-[#F8F6E7] ${
                      task.completed ? "line-through opacity-70" : ""
                    } ${
                      editing || task.description?.trim()
                        ? "cursor-pointer hover:text-[#C8E6C9]"
                        : "cursor-default"
                    }`}
                  >
                    {task.title}
                  </button>

                  <div className="flex justify-center">
                    <PriorityBars level={task.priority} />
                  </div>

                  <span className="font-zen text-center text-sm text-[#F8F6E7]/80">
                    {formatTaskDeadline(task.startDate, task.endDate)}
                  </span>

                  <div className="flex items-center justify-end gap-2">
                    <ThemeTag themeId={task.themeId} />
                    {editing ? (
                      <button
                        type="button"
                        aria-label="Удалить задачу"
                        onClick={() => void handleDelete(task.id)}
                        className="rounded-full bg-[#F8F6E7] p-0.5"
                      >
                        <Image src="/delete.svg" alt="" width={16} height={16} />
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[90vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-[6px] border border-[#F8F6E7] bg-[#191919] p-5 shadow-[6px_6px_0_0_#49644E]"
          >
            <h2 className="font-amatic text-3xl font-bold text-[#F8F6E7]">
              {modalMode === "create" ? "Новая задача" : "Редактировать"}
            </h2>

            <label className="flex flex-col gap-1">
              <span className="font-zen text-sm text-[#F8F6E7]">Название</span>
              <input
                className={inputClassName}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-zen text-sm text-[#F8F6E7]">Описание</span>
              <textarea
                className={`${inputClassName} h-24 resize-none`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-zen text-sm text-[#F8F6E7]">
                Время (необязательно)
              </span>
              <input
                className={inputClassName}
                value={time}
                onChange={(event) => setTime(event.target.value)}
                placeholder="9:00-10:50"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-zen text-sm text-[#F8F6E7]">Начало</span>
                <input
                  type="date"
                  className={inputClassName}
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    if (event.target.value > endDate) setEndDate(event.target.value);
                  }}
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-zen text-sm text-[#F8F6E7]">Конец</span>
                <input
                  type="date"
                  className={inputClassName}
                  value={endDate}
                  min={startDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = toDateKey();
                  setStartDate(today);
                  setEndDate(today);
                }}
                className="font-zen rounded-[3px] border border-[#F8F6E7] px-2 py-1 text-xs"
              >
                Сегодня
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = toDateKey();
                  setStartDate(today);
                  setEndDate(addDays(today, 6));
                }}
                className="font-zen rounded-[3px] border border-[#F8F6E7] px-2 py-1 text-xs"
              >
                Неделя
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-zen text-sm">Важность</span>
              <div className="flex gap-3">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`flex items-center gap-2 rounded-[3px] border px-3 py-2 ${
                      priority === level
                        ? "border-[#F8F6E7]"
                        : "border-[#F8F6E7]/30"
                    }`}
                  >
                    <PriorityBars level={level} />
                    <span className="font-zen text-sm">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-zen text-sm">Тема</span>
              <div className="flex flex-wrap gap-2">
                {TASK_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className={`rounded-full px-3 py-1 text-xs text-[#F8F6E7] ${
                      themeId === theme.id
                        ? "ring-2 ring-[#F8F6E7] ring-offset-1 ring-offset-[#191919]"
                        : "opacity-80"
                    }`}
                    style={{ backgroundColor: theme.color }}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p className="font-zen text-sm text-red-400">{error}</p>
            ) : null}

            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="flex h-10 flex-1 items-center justify-center rounded-[3px] border border-[#F8F6E7]"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex h-10 flex-1 items-center justify-center rounded-[3px] border border-[#F8F6E7] bg-[#F8F6E7] text-[#191919] disabled:opacity-60"
              >
                {saving ? "..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {detailTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[6px] border border-[#F8F6E7] bg-[#191919] p-5 shadow-[6px_6px_0_0_#49644E]">
            <h2 className="font-amatic text-3xl font-bold">{detailTask.title}</h2>
            <p className="font-zen mt-3 whitespace-pre-wrap text-sm opacity-90">
              {detailTask.description}
            </p>
            <button
              type="button"
              onClick={() => setDetailTask(null)}
              className="mt-5 flex h-10 w-full items-center justify-center rounded-[3px] border border-[#F8F6E7] bg-[#F8F6E7] text-[#191919]"
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
