"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScheduleEditor, { ScheduleItem } from "./ScheduleEditor";
import {
  durationToHeight,
  HOUR_HEIGHT_PX,
  minutesToTop,
  parseTimeRange,
  TIMELINE_DEFAULT_HOUR,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "@/lib/schedule";
import { getTheme } from "@/lib/themes";

type DayMeeting = {
  id: string;
  date: string;
  time: string;
  title: string;
  room: string;
  color: string;
  sortKey: number;
};

type TimedTask = {
  id: string;
  title: string;
  time: string;
  themeId: string;
  endDate: string;
  startDate: string;
  completed: boolean;
};

type ScheduleProps = {
  dateKey: string;
  weekday: number;
};

type Block = {
  id: string;
  title: string;
  subtitle?: string;
  timeLabel: string;
  color: string;
  top: number;
  height: number;
};

const HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
  (_, index) => TIMELINE_START_HOUR + index,
);

function toBlocks(
  items: Array<{
    id: string;
    time: string;
    title: string;
    room?: string;
    color: string;
  }>,
): Block[] {
  const result: Block[] = [];
  for (const item of items) {
    const range = parseTimeRange(item.time);
    if (!range) continue;
    result.push({
      id: item.id,
      title: item.title,
      subtitle: item.room,
      timeLabel: item.time,
      color: item.color,
      top: minutesToTop(range.start),
      height: durationToHeight(range.start, range.end),
    });
  }
  return result;
}

export default function Schedule({ dateKey, weekday }: ScheduleProps) {
  const [weekly, setWeekly] = useState<ScheduleItem[]>([]);
  const [meetings, setMeetings] = useState<DayMeeting[]>([]);
  const [tasks, setTasks] = useState<TimedTask[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleRes, meetingsRes, tasksRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch(`/api/meetings?date=${dateKey}`),
        fetch("/api/tasks"),
      ]);
      const scheduleData = await scheduleRes.json();
      const meetingsData = await meetingsRes.json();
      const tasksData = await tasksRes.json();
      if (scheduleRes.ok) setWeekly(scheduleData.items ?? []);
      if (meetingsRes.ok) setMeetings(meetingsData.meetings ?? []);
      if (tasksRes.ok) setTasks(tasksData.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = (TIMELINE_DEFAULT_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX;
  }, [dateKey, loading]);

  const leftBlocks = useMemo(() => {
    const weeklyItems = weekly
      .filter((item) => item.weekday === weekday)
      .map((item) => ({
        id: `w-${item.id}`,
        time: item.time,
        title: item.title,
        room: item.room,
        color: item.color,
      }));

    const onceItems = meetings.map((item) => ({
      id: `m-${item.id}`,
      time: item.time,
      title: item.title,
      room: item.room,
      color: item.color,
    }));

    return toBlocks([...weeklyItems, ...onceItems]);
  }, [weekly, meetings, weekday]);

  const rightBlocks = useMemo(() => {
    const timed = tasks.filter((task) => {
      if (!task.time?.trim()) return false;
      return task.endDate === dateKey || task.startDate === dateKey;
    });

    return toBlocks(
      timed.map((task) => ({
        id: `t-${task.id}`,
        time: task.time,
        title: task.title,
        color: getTheme(task.themeId).color,
      })),
    );
  }, [tasks, dateKey]);

  const timelineHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT_PX;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#191919]">
      <div className="flex shrink-0 items-stretch">
        <div className="flex w-11 flex-col gap-1 py-1 pl-1 border-b border-[#F8F6E7]/40">
          <button
            type="button"
            aria-label="Настройки"
            className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#5A7358] transition-colors hover:bg-[#3D523D]"
          >
            <Image src="/Settings.svg" alt="" width={20} height={20} />
          </button>
          <button
            type="button"
            aria-label="Изменить расписание"
            onClick={() => setEditorOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#5A7358] transition-colors hover:bg-[#3D523D]"
          >
            <Image src="/plus.svg" alt="" width={20} height={20} />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center border-b border-[#F8F6E7]/40">
          <h1 className="font-amatic text-3xl font-bold tracking-wide text-[#F8F6E7]">
            РАСПИСАНИЕ
          </h1>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="font-zen p-4 text-sm text-[#F8F6E7] opacity-60">
            Загрузка...
          </p>
        ) : (
          <div className="relative flex" style={{ height: timelineHeight }}>
            <div className="relative w-12 shrink-0">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-1 font-zen text-[11px] text-[#F8F6E7]/60"
                  style={{ top: (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX - 6 }}
                >
                  {hour}:00
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-0 left-0 border-t border-[#F8F6E7]/20"
                  style={{ top: (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX }}
                />
              ))}

              <div className="absolute inset-0 grid grid-cols-2 gap-1 pr-1 pl-1">
                <div className="relative">
                  {leftBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="absolute right-0.5 left-0 overflow-hidden rounded-[8px] px-2 py-1 text-[#191919]"
                      style={{
                        top: block.top,
                        height: block.height,
                        backgroundColor: block.color,
                      }}
                    >
                      <p className="font-zen truncate text-[18px]">
                        {block.title}
                      </p>
                      {block.subtitle ? (
                        <p className="font-zen truncate text-[14px]">
                          {block.subtitle} каб
                        </p>
                      ) : null}
                      <p className="font-zen absolute right-1.5 bottom-1 text-[16px] opacity-80">
                        {block.timeLabel}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  {rightBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="absolute right-0 left-0.5 overflow-hidden rounded-[8px] px-2 py-1 text-[#F8F6E7]"
                      style={{
                        top: block.top,
                        height: block.height,
                        backgroundColor: block.color,
                      }}
                    >
                      <p className="font-zen truncate text-[18px]">
                        {block.title}
                      </p>
                      <p className="font-zen absolute right-1.5 bottom-1 text-[16px] opacity-80">
                        {block.timeLabel}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ScheduleEditor
        open={editorOpen}
        initialWeekday={weekday}
        onClose={() => {
          setEditorOpen(false);
          void load();
        }}
        onChanged={() => void load()}
      />
    </div>
  );
}
