"use client";

import { useState } from "react";
import { apiSend, ApiClientError, errorMessage } from "@/lib/client";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PRIORITY_LEVELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Priority,
  type TaskStatus,
} from "@/lib/domain";
import type { MemberDto, TaskDto } from "@/lib/serialize";
import {
  inputClassName,
  modalBackdropClassName,
  modalCardClassName,
  smallButtonClassName,
} from "@/lib/ui";
import { PriorityBars } from "./PriorityBars";

type TaskDetailModalProps = {
  task: TaskDto;
  members: MemberDto[];
  canEdit: boolean;
  onClose: () => void;
  onUpdated: (task: TaskDto) => void;
  onConflict: () => void;
};

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TaskDetailModal({
  task,
  members,
  canEdit,
  onClose,
  onUpdated,
  onConflict,
}: TaskDetailModalProps) {
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [deadline, setDeadline] = useState(toLocalInputValue(task.deadline));
  const [assigneeId, setAssigneeId] = useState(task.assigneeId);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hasSubtasks = task.subtasks.length > 0;
  const assignable = members.filter((member) => member.role !== "VIEWER");

  async function run(action: () => Promise<TaskDto>) {
    setError("");
    setBusy(true);
    try {
      onUpdated(await action());
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.code === "VERSION_CONFLICT") {
        onConflict();
      }
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const addSubtask = () =>
    run(async () => {
      const { task: updated } = await apiSend<{ task: TaskDto }>(
        `/api/plan-tasks/${task.id}/subtasks`,
        "POST",
        { title: subtaskTitle },
      );
      setSubtaskTitle("");
      return updated;
    });

  const toggleSubtask = (subtaskId: string, isDone: boolean) =>
    run(async () => {
      const { task: updated } = await apiSend<{ task: TaskDto }>(
        `/api/plan-tasks/${task.id}/subtasks`,
        "PATCH",
        { subtaskId, isDone },
      );
      return updated;
    });

  const saveFields = () =>
    run(async () => {
      const payload: Record<string, unknown> = {
        version: task.version,
        deadline: new Date(deadline).toISOString(),
        assigneeId,
        priority,
      };
      if (!hasSubtasks) payload.status = status;

      const { task: updated } = await apiSend<{ task: TaskDto }>(
        `/api/plan-tasks/${task.id}`,
        "PATCH",
        payload,
      );
      return updated;
    });

  return (
    <div className={modalBackdropClassName}>
      <div className={`${modalCardClassName} max-w-lg`}>
        <div className="flex items-start gap-3">
          <PriorityBars level={PRIORITY_LEVELS[task.priority]} />
          <div className="min-w-0 flex-1">
            <h2 className="font-amatic text-3xl font-bold text-[#F8F6E7]">
              {task.title}
            </h2>
            <p className="font-zen mt-1 text-sm text-[#F8F6E7]/60">
              {STATUS_LABELS[task.status]} · {task.progress}% ·{" "}
              {task.assigneeNick}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-zen text-sm text-[#F8F6E7]/70 hover:text-[#F8F6E7]"
          >
            Закрыть
          </button>
        </div>

        {task.description ? (
          <p className="font-zen text-sm text-[#F8F6E7]/80">{task.description}</p>
        ) : null}

        {canEdit ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="font-zen text-sm text-[#F8F6E7]">Дедлайн</span>
              <input
                type="datetime-local"
                className={inputClassName}
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-zen text-sm text-[#F8F6E7]">
                Ответственный
              </span>
              <select
                className={inputClassName}
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
              >
                {assignable.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.nick}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-2">
              <span className="font-zen text-sm text-[#F8F6E7]">Приоритет</span>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPriority(option)}
                    className={`flex items-center gap-2 rounded-[3px] border px-2 py-1 ${
                      priority === option
                        ? "border-[#F8F6E7]"
                        : "border-[#F8F6E7]/30"
                    }`}
                  >
                    <PriorityBars level={PRIORITY_LEVELS[option]} />
                    <span className="font-zen text-xs text-[#F8F6E7]">
                      {PRIORITY_LABELS[option]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {!hasSubtasks ? (
              <label className="flex flex-col gap-1">
                <span className="font-zen text-sm text-[#F8F6E7]">Статус</span>
                <select
                  className={inputClassName}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as TaskStatus)
                  }
                >
                  {TASK_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {STATUS_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void saveFields()}
              className={smallButtonClassName}
            >
              Сохранить
            </button>

            <div className="border-t border-[#F8F6E7]/30 pt-3">
              <p className="font-zen mb-2 text-sm text-[#F8F6E7]">Подзадачи</p>
              <ul className="mb-2 flex flex-col gap-1">
                {task.subtasks.map((subtask) => (
                  <li key={subtask.id} className="font-zen flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={subtask.isDone}
                      disabled={busy}
                      onChange={(event) =>
                        void toggleSubtask(subtask.id, event.target.checked)
                      }
                    />
                    <span
                      className={
                        subtask.isDone ? "line-through opacity-60" : ""
                      }
                    >
                      {subtask.title}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  className={inputClassName}
                  placeholder="Новая подзадача"
                  value={subtaskTitle}
                  onChange={(event) => setSubtaskTitle(event.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !subtaskTitle.trim()}
                  onClick={() => void addSubtask()}
                  className={smallButtonClassName}
                >
                  +
                </button>
              </div>
            </div>
          </>
        ) : null}

        {error ? (
          <p className="font-zen text-sm text-red-400">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
