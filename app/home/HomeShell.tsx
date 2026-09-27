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
import { formatDateTitle, getWeekdayIndex, toDateKey } from "@/lib/tasks";

export type HomeView = "day" | "week" | "month" | "tasks" | "plans";

type HomeShellProps = {
  nick: string;
};

const NAV: Array<{ id: HomeView; label: string }> = [
  { id: "day", label: "День" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "tasks", label: "Задания" },
  { id: "plans", label: "Планы" },
];

export default function HomeShell({ nick }: HomeShellProps) {
  const [view, setView] = useState<HomeView>("day");
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey());
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [scheduleTick, setScheduleTick] = useState(0);

  const dateTitle = useMemo(
    () => formatDateTitle(selectedDateKey),
    [selectedDateKey],
  );

  const weekday = getWeekdayIndex(selectedDateKey);

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

      {/* Main content — always 82%, same as week */}
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
          <div className="flex h-full flex-col items-center justify-center text-[#F8F6E7]">
            <p className="font-amatic text-5xl font-bold">Планы</p>
            <p className="font-zen mt-2 text-sm opacity-50">В разработке</p>
          </div>
        ) : null}
      </div>

      {/* Clock + calendar — fixed 18% on the right, every page */}
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
    </div>
  );
}
