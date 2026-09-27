"use client";

import {
  PRIORITY_LEVELS,
  STATUS_LABELS,
  type TaskStatus,
} from "@/lib/domain";
import type { ProjectDto, TaskDto } from "@/lib/serialize";
import { formatDateShort, toDateKey } from "@/lib/tasks";
import { TASK_STATUS_COLORS } from "@/lib/themes";
import { PriorityBars } from "./PriorityBars";

const rowGridClass =
  "grid w-full min-w-0 grid-cols-[1.35rem_minmax(0,1fr)_minmax(4rem,6rem)_minmax(4rem,5.5rem)_3.5rem_minmax(4.5rem,5.5rem)] items-center gap-x-2";

type TaskListPanelProps = {
  tasks: TaskDto[];
  projects: ProjectDto[];
  onOpenTask: (taskId: string) => void;
};

function StatusTag({ status }: { status: TaskStatus }) {
  return (
    <span
      className="font-zen inline-flex min-w-[5rem] justify-center rounded-full px-2 py-0.5 text-xs whitespace-nowrap text-[#F8F6E7]"
      style={{ backgroundColor: TASK_STATUS_COLORS[status] }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function TaskListPanel({
  tasks,
  projects,
  onOpenTask,
}: TaskListPanelProps) {
  const projectNames = new Map(
    projects.map((project) => [project.id, project.name]),
  );
  const todayKey = toDateKey();

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className={`${rowGridClass} shrink-0 border-b border-[#F8F6E7] pb-2`}>
        <span />
        <h2 className="font-zen truncate text-[20px] text-[#F8F6E7]">Задачи</h2>
        <span className="font-zen text-center text-[13px] text-[#F8F6E7]/50">
          проект
        </span>
        <span className="font-zen text-center text-[13px] text-[#F8F6E7]/50">
          ответственный
        </span>
        <span className="font-zen text-center text-[13px] text-[#F8F6E7]/50">
          срок
        </span>
        <span className="font-zen text-center text-[13px] text-[#F8F6E7]/50">
          прогресс
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <p className="font-zen mt-3 text-sm text-[#F8F6E7]/50">
            Пока нет задач
          </p>
        ) : (
          <ul>
            {tasks.map((task) => {
              const deadlineKey = toDateKey(new Date(task.deadline));
              const overdue = task.status !== "DONE" && deadlineKey < todayKey;

              return (
                <li key={task.id} className={`${rowGridClass} py-2`}>
                  <div className="flex justify-center">
                    <PriorityBars level={PRIORITY_LEVELS[task.priority]} />
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenTask(task.id)}
                    className={`font-zen min-w-0 truncate text-left text-base text-[#F8F6E7] hover:text-[#C8E6C9] ${
                      task.status === "DONE" ? "line-through opacity-70" : ""
                    }`}
                  >
                    {task.title}
                  </button>

                  <span className="font-zen truncate text-center text-sm text-[#F8F6E7]/80">
                    {projectNames.get(task.projectId) ?? "—"}
                  </span>

                  <span className="font-zen truncate text-center text-sm text-[#F8F6E7]/80">
                    {task.assigneeNick}
                  </span>

                  <span
                    className={`font-zen text-center text-sm ${
                      overdue ? "text-red-400" : "text-[#F8F6E7]/80"
                    }`}
                  >
                    {formatDateShort(deadlineKey)}
                  </span>

                  <div className="flex items-center justify-end">
                    <StatusTag status={task.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
