"use client";

import { useMemo, useState } from "react";
import Schedule from "./Schedule";
import ScheduleEditor from "./ScheduleEditor";
import ClockPanel from "./ClockPanel";
import CalendarPanel from "./CalendarPanel";
import TasksPanel from "./TasksPanel";
import AllTasksPanel from "./AllTasksPanel";
import WeekPanel from "./WeekPanel";
import MonthPanel from "./MonthPanel";
import WorkspacePanel from "./WorkspacePanel";
import TaskListPanel from "./TaskListPanel";
import TaskFormModal from "./TaskFormModal";
import TaskDetailModal from "./TaskDetailModal";
import { useWorkspace } from "./useWorkspace";
import { canEditTask } from "@/lib/access-rules";
import { smallButtonClassName } from "@/lib/ui";
import { formatDateTitle, getWeekdayIndex, toDateKey } from "@/lib/tasks";

export type HomeView = "day" | "week" | "month" | "tasks" | "plans";

type HomeShellProps = {
  nick: string;
  userId: string;
};

const NAV: Array<{ id: HomeView; label: string }> = [
  { id: "day", label: "День" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "tasks", label: "Задания" },
  { id: "plans", label: "Планы" },
];

function defaultDeadlineValue(dateKey: string) {
  return `${dateKey}T18:00`;
}

export default function HomeShell({ nick, userId }: HomeShellProps) {
  const [view, setView] = useState<HomeView>("day");
  const { state, selectWorkspace, replaceTask, reload } = useWorkspace({
    enabled: view === "plans",
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey());
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [scheduleTick, setScheduleTick] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const dateTitle = useMemo(
    () => formatDateTitle(selectedDateKey),
    [selectedDateKey],
  );

  const weekday = getWeekdayIndex(selectedDateKey);

  const visibleTasks = useMemo(
    () =>
      activeProjectId
        ? state.tasks.filter((task) => task.projectId === activeProjectId)
        : state.tasks,
    [state.tasks, activeProjectId],
  );

  const openTask = openTaskId
    ? (state.tasks.find((task) => task.id === openTaskId) ?? null)
    : null;

  const role = state.activeWorkspace?.role ?? "VIEWER";
  const canCreate = role === "OWNER" || role === "MEMBER";

  function openDay(dateKey: string) {
    setSelectedDateKey(dateKey);
    setView("day");
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#191919]">
      <nav className="absolute top-0 left-[50%] z-30 flex -translate-x-1/2 gap-4">
        {NAV.map((item) => {
          const active = view === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`font-zen rounded-b-[6px] border-r-2 border-b-2 border-l-2 border-[#F8F6E7] px-6 py-1.5 text-[18px] transition-all duration-150 ease-out ${
                active
                  ? "bg-[#F8F6E7] text-[#191919] shadow-[3px_3px_0_0_#49644E]"
                  : "bg-transparent text-[#F8F6E7] hover:bg-[#222222] hover:shadow-[2px_2px_0_0_#49644E] active:translate-x-[3px] active:translate-y-[3px] active:bg-[#D6D3C2] active:text-[#191919] active:shadow-[0_0_0_0_#49644E]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="absolute inset-y-0 left-0 w-[82%]">
        {view === "day" ? (
          <div className="flex h-full w-full flex-row">
            <div className="flex h-full w-[30.5%] flex-col items-center border-r-3 border-[#F8F6E7]">
              <Schedule dateKey={selectedDateKey} weekday={weekday} />
            </div>
            <div className="relative flex h-full min-w-0 flex-1 flex-col items-stretch">
              <TasksPanel dateKey={selectedDateKey} dateTitle={dateTitle} />
            </div>
          </div>
        ) : null}

        {view === "week" ? (
          <WeekPanel
            key={scheduleTick}
            onOpenScheduleEditor={() => setScheduleEditorOpen(true)}
          />
        ) : null}

        {view === "month" ? (
          <MonthPanel
            selectedDateKey={selectedDateKey}
            onSelectDate={openDay}
          />
        ) : null}

        {view === "tasks" ? <AllTasksPanel /> : null}

        {view === "plans" ? (
          <div className="flex h-full w-full flex-row pt-10">
            <div className="flex h-full w-[30.5%] shrink-0 flex-col border-r-3 border-[#F8F6E7]">
              <WorkspacePanel
                workspaces={state.workspaces}
                activeWorkspace={state.activeWorkspace}
                projects={state.projects}
                members={state.members}
                tasks={state.tasks}
                activeProjectId={activeProjectId}
                onSelectWorkspace={(workspaceId) => {
                  setActiveProjectId(null);
                  selectWorkspace(workspaceId);
                }}
                onSelectProject={setActiveProjectId}
                onChanged={() => void reload()}
              />
            </div>
            <div className="relative flex h-full min-w-0 flex-1 flex-col px-5 pb-4">
              <div className="mb-3 flex shrink-0 items-center gap-3">
                <h1 className="font-amatic text-4xl font-bold tracking-wide text-[#F8F6E7] uppercase">
                  Задачи
                </h1>
                <button
                  type="button"
                  disabled={!canCreate || state.projects.length === 0}
                  onClick={() => setTaskFormOpen(true)}
                  className={`${smallButtonClassName} ml-auto h-9 px-3 text-sm disabled:opacity-40`}
                >
                  + Задача
                </button>
              </div>

              {state.status === "loading" ? (
                <p className="font-zen text-sm text-[#F8F6E7]/60">Загрузка...</p>
              ) : state.status === "error" ? (
                <div className="flex flex-col items-start gap-2">
                  <p className="font-zen text-sm text-red-400">{state.error}</p>
                  <button
                    type="button"
                    onClick={() => void reload()}
                    className={smallButtonClassName}
                  >
                    Повторить
                  </button>
                </div>
              ) : (
                <TaskListPanel
                  tasks={visibleTasks}
                  projects={state.projects}
                  onOpenTask={setOpenTaskId}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-y-0 right-0 flex w-[18%] flex-col items-end p-1 pt-0">
        <div className="flex h-full w-min flex-col">
          <ClockPanel nick={nick} />
          <CalendarPanel
            selectedDateKey={selectedDateKey}
            onSelectDate={openDay}
          />
        </div>
      </div>

      <ScheduleEditor
        open={scheduleEditorOpen}
        initialWeekday={weekday}
        onClose={() => setScheduleEditorOpen(false)}
        onChanged={() => setScheduleTick((value) => value + 1)}
      />

      {view === "plans" && taskFormOpen ? (
        <TaskFormModal
          projects={
            activeProjectId
              ? state.projects.filter((project) => project.id === activeProjectId)
              : state.projects
          }
          members={state.members}
          defaultProjectId={activeProjectId}
          defaultDeadline={defaultDeadlineValue(selectedDateKey)}
          currentUserId={userId}
          onClose={() => setTaskFormOpen(false)}
          onCreated={(task) => {
            replaceTask(task);
            void reload();
          }}
        />
      ) : null}

      {view === "plans" && openTask ? (
        <TaskDetailModal
          task={openTask}
          members={state.members}
          canEdit={canEditTask(role, openTask, userId)}
          onClose={() => setOpenTaskId(null)}
          onUpdated={(task) => {
            replaceTask(task);
            setOpenTaskId(task.id);
          }}
          onConflict={() => void reload()}
        />
      ) : null}
    </div>
  );
}
