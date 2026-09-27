"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatDayMonth,
  getWeekDateKeys,
  getWeekdayIndex,
} from "@/lib/tasks";
import { getTheme, WEEKDAY_LABELS } from "@/lib/themes";
import {
  durationToHeight,
  HOUR_HEIGHT_PX,
  minutesToTop,
  parseTimeRange,
  TIMELINE_DEFAULT_HOUR,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "@/lib/schedule";

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

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  room: string;
  color: string;
  weekday: number;
  sortKey: number;
};

type WeekPanelProps = {
  onOpenScheduleEditor?: () => void;
};

const HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
  (_, index) => TIMELINE_START_HOUR + index,
);

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="font-zen flex cursor-pointer items-center gap-2 text-sm text-[#F8F6E7]">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`relative h-5 w-9 rounded-full border border-[#F8F6E7] transition-colors ${
          on ? "bg-[#49644E]" : "bg-transparent"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[#F8F6E7] transition-transform ${
            on ? "left-4" : "left-0.5"
          }`}
        />
      </button>
      {label}
    </label>
  );
}

export default function WeekPanel({ onOpenScheduleEditor }: WeekPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showTasks, setShowTasks] = useState(true);
  const [showSchedule, setShowSchedule] = useState(true);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekKeys = useMemo(() => getWeekDateKeys(new Date()), []);

  useEffect(() => {
    void (async () => {
      const [tasksRes, scheduleRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/schedule"),
      ]);
      const tasksData = await tasksRes.json();
      const scheduleData = await scheduleRes.json();
      if (tasksRes.ok) setTasks(tasksData.tasks ?? []);
      if (scheduleRes.ok) setSchedule(scheduleData.items ?? []);
    })();
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop =
      (TIMELINE_DEFAULT_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX;
  }, []);

  const weekStart = weekKeys[0];
  const weekEnd = weekKeys[6];

  const multiDayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.startDate === task.endDate) return false;
      if (task.endDate < weekStart || task.startDate > weekEnd) return false;
      return true;
    });
  }, [tasks, weekStart, weekEnd]);

  const timelineHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT_PX;

  function dayTimedTasks(dayKey: string) {
    return tasks.filter((task) => {
      if (!task.time?.trim()) return false;
      if (task.startDate !== task.endDate) return false;
      return task.endDate === dayKey || task.startDate === dayKey;
    });
  }

  function spanStyle(task: Task) {
    const startIdx = Math.max(
      0,
      weekKeys.findIndex((key) => key >= task.startDate),
    );
    const endIdxRaw = weekKeys.findIndex((key) => key > task.endDate);
    const endIdx = endIdxRaw === -1 ? 6 : Math.max(startIdx, endIdxRaw - 1);
    const left = `${(startIdx / 7) * 100}%`;
    const width = `${((endIdx - startIdx + 1) / 7) * 100}%`;
    return { left, width };
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden pt-20 text-[#F8F6E7]">
      <div className="absolute top-0 left-3 z-30 flex flex-col gap-2">
        <Toggle
          label="задачи"
          on={showTasks}
          onToggle={() => setShowTasks((value) => !value)}
        />
        <Toggle
          label="расписание"
          on={showSchedule}
          onToggle={() => setShowSchedule((value) => !value)}
        />
        {onOpenScheduleEditor ? (
          <button
            type="button"
            onClick={onOpenScheduleEditor}
            className="font-zen self-start text-xs text-[#F8F6E7] opacity-50 underline-offset-2 hover:opacity-100 hover:underline"
          >
            изменить расписание
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        <div className="grid shrink-0 grid-cols-[5rem_repeat(7,minmax(0,1fr))] border-b border-[#F8F6E7]">
          <div />
          {weekKeys.map((dayKey, index) => (
            <div
              key={dayKey}
              className={`px-2 py-2 text-center ${
                index < 6 ? "border-r border-[#F8F6E7]/40" : ""
              }`}
            >
              <p className="font-zen text-[14px] tracking-wide text-left">
                {WEEKDAY_LABELS[index]}
              </p>
              <p className="font-zen text-[12px] opacity-70 text-left ">
                {formatDayMonth(dayKey)}
              </p>
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div
            className="relative grid grid-cols-[5rem_repeat(7,minmax(0,1fr))]"
            style={{ height: timelineHeight }}
          >
            <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-1 font-zen text-[10px] text-[#F8F6E7]/55"
                  style={{
                    top: (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX - 6,
                  }}
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {weekKeys.map((dayKey, dayIndex) => {
              const weekday = getWeekdayIndex(dayKey);
              const daySchedule = schedule
                .filter((item) => item.weekday === weekday)
                .sort((a, b) => a.sortKey - b.sortKey);
              const timedTasks = dayTimedTasks(dayKey);

              return (
                <div
                  key={dayKey}
                  className={`relative border-l border-[#F8F6E7]/30 ${
                    dayIndex === 6 ? "border-r border-[#F8F6E7]/30" : ""
                  }`}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute right-0 left-0 border-t border-[#F8F6E7]/15"
                      style={{
                        top: (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX,
                      }}
                    />
                  ))}

                  {showSchedule
                    ? daySchedule.map((item) => {
                        const range = parseTimeRange(item.time);
                        if (!range) return null;
                        return (
                          <div
                            key={item.id}
                            className="absolute right-1 left-1 overflow-hidden rounded-[6px] px-1.5 py-1 text-[#191919]"
                            style={{
                              top: minutesToTop(range.start),
                              height: durationToHeight(range.start, range.end),
                              backgroundColor: item.color,
                            }}
                          >
                            <p className="font-zen truncate text-[11px] font-semibold leading-tight">
                              {item.title}
                            </p>
                            <p className="font-zen truncate text-[9px] opacity-75">
                              {item.room}
                            </p>
                          </div>
                        );
                      })
                    : null}

                  {showTasks
                    ? timedTasks.map((task, taskIndex) => {
                        const range = parseTimeRange(task.time);
                        if (!range) return null;
                        const theme = getTheme(task.themeId);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            title={`${task.title} (${task.time})`}
                            onClick={() => {
                              if (task.description?.trim()) {
                                setDetailTask(task);
                              }
                            }}
                            className="absolute z-10 overflow-hidden rounded-[4px] border border-[#F8F6E7]/30"
                            style={{
                              top: minutesToTop(range.start),
                              height: durationToHeight(range.start, range.end),
                              width: "28%",
                              right: `${4 + (taskIndex % 2) * 30}%`,
                              backgroundColor: theme.color,
                            }}
                          >
                            <span className="font-zen block truncate px-0.5 pt-0.5 text-[9px] leading-none text-[#F8F6E7]">
                              {task.time}
                            </span>
                          </button>
                        );
                      })
                    : null}
                </div>
              );
            })}

            {showTasks ? (
              <div className="pointer-events-none absolute right-0 bottom-2 left-[5rem] z-20">
                <div className="relative h-14">
                  {multiDayTasks.map((task, index) => {
                    const theme = getTheme(task.themeId);
                    const { left, width } = spanStyle(task);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          if (task.description?.trim()) setDetailTask(task);
                        }}
                        className="pointer-events-auto absolute h-5 overflow-hidden rounded-[4px] px-2 text-left"
                        style={{
                          left,
                          width,
                          bottom: index * 22,
                          backgroundColor: theme.color,
                        }}
                      >
                        <span className="font-zen truncate text-[10px] text-[#F8F6E7]">
                          {task.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
