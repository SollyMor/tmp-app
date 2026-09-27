"use client";

import { FormEvent, useState } from "react";
import { apiSend, ApiClientError, errorMessage } from "@/lib/client";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PRIORITY_LEVELS,
  type Priority,
} from "@/lib/domain";
import type { MemberDto, ProjectDto, TaskDto } from "@/lib/serialize";
import {
  inputClassName,
  modalBackdropClassName,
  modalCardClassName,
} from "@/lib/ui";
import { PriorityBars } from "./PriorityBars";

type TaskFormModalProps = {
  projects: ProjectDto[];
  members: MemberDto[];
  defaultProjectId: string | null;
  defaultDeadline: string;
  currentUserId: string;
  onClose: () => void;
  onCreated: (task: TaskDto) => void;
};

export default function TaskFormModal({
  projects,
  members,
  defaultProjectId,
  defaultDeadline,
  currentUserId,
  onClose,
  onCreated,
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [estimateMin, setEstimateMin] = useState(60);
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const assignable = members.filter((member) => member.role !== "VIEWER");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSaving(true);

    try {
      const { task } = await apiSend<{ task: TaskDto }>("/api/plan-tasks", "POST", {
        projectId,
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        priority,
        estimateMin,
        assigneeId,
      });

      onCreated(task);
      onClose();
    } catch (caught) {
      if (caught instanceof ApiClientError) setFieldErrors(caught.fields);
      setError(errorMessage(caught, "Не удалось создать задачу"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={modalBackdropClassName}>
      <form
        onSubmit={handleSubmit}
        className={`${modalCardClassName} max-w-md`}
      >
        <h2 className="font-amatic text-3xl font-bold text-[#F8F6E7]">
          Новая задача
        </h2>

        <label className="flex flex-col gap-1">
          <span className="font-zen text-sm text-[#F8F6E7]">Название</span>
          <input
            className={inputClassName}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Лабораторная 1"
            required
          />
          {fieldErrors.title ? (
            <span className="font-zen text-xs text-red-400">
              {fieldErrors.title}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-zen text-sm text-[#F8F6E7]">Описание</span>
          <textarea
            className={`${inputClassName} h-20 resize-none`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Необязательно"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-zen text-sm text-[#F8F6E7]">Проект</span>
          <select
            className={inputClassName}
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            required
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-zen text-sm text-[#F8F6E7]">Дедлайн</span>
          <input
            type="datetime-local"
            className={inputClassName}
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            required
          />
          {fieldErrors.deadline ? (
            <span className="font-zen text-xs text-red-400">
              {fieldErrors.deadline}
            </span>
          ) : null}
        </label>

        <div className="flex flex-col gap-2">
          <span className="font-zen text-sm text-[#F8F6E7]">Приоритет</span>
          <div className="flex flex-wrap gap-3">
            {PRIORITIES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPriority(option)}
                className={`flex items-center gap-2 rounded-[3px] border px-3 py-2 ${
                  priority === option
                    ? "border-[#F8F6E7]"
                    : "border-[#F8F6E7]/30"
                }`}
              >
                <PriorityBars level={PRIORITY_LEVELS[option]} />
                <span className="font-zen text-sm text-[#F8F6E7]">
                  {PRIORITY_LABELS[option]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-zen text-sm text-[#F8F6E7]">
            Оценка времени, минут
          </span>
          <input
            type="number"
            min={15}
            max={540}
            step={15}
            className={inputClassName}
            value={estimateMin}
            onChange={(event) => setEstimateMin(Number(event.target.value))}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-zen text-sm text-[#F8F6E7]">Ответственный</span>
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

        {error ? (
          <p className="font-zen text-sm text-red-400">{error}</p>
        ) : null}

        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 flex-1 items-center justify-center rounded-[3px] border border-[#F8F6E7] text-[#F8F6E7]"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex h-10 flex-1 items-center justify-center rounded-[3px] border border-[#F8F6E7] bg-[#F8F6E7] text-[#191919] disabled:opacity-60"
          >
            {saving ? "..." : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
}
