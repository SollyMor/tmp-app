"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MONTHS = [
  "Января",
  "Февраля",
  "Марта",
  "Апреля",
  "Мая",
  "Июня",
  "Июля",
  "Августа",
  "Сентября",
  "Октября",
  "Ноября",
  "Декабря",
];

type ClockPanelProps = {
  nick: string;
};

function formatDate(date: Date) {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const weekday = date.toLocaleDateString("ru-RU", { weekday: "long" });
  return `${day} ${month}, ${weekday}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function ClockDigit({ value }: { value: string }) {
  return (
    <div className="flex h-[4.5rem] w-[2.75rem] shrink-0 items-center justify-center rounded-[3px] bg-[#F8F6E7] text-[2.5rem] leading-none font-semibold text-[#1E1E1E] select-none shadow-[3px_3px_0_0_#49644E]">
      {value}
    </div>
  );
}

export default function ClockPanel({ nick }: ClockPanelProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const sync = () => setNow(new Date());
    sync();

    const msToNextMinute =
      (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();

    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      sync();
      intervalId = window.setInterval(sync, 60_000);
    }, msToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());
  const dateLabel = formatDate(now);

  return (
    <div className="flex w-max flex-col gap-3 rounded-[6px] px-3 py-3 text-[#1E1E1E]">
      <div className="flex items-center gap-4">
        <button type="button" aria-label="Настройки" className="shrink-0">
          <Image src="/Settings(1).svg" alt="" width={28} height={28} />
        </button>
        <button type="button" aria-label="Тема" className="shrink-0 ">
          <Image src="/Sun(1).svg" alt="" width={28} height={28} />
        </button>
        <span className="mx-2 h-6 w-px shrink-0 bg-[#1E1E1E]/60" />
        <Image
          src="/account_circle(1).svg"
          alt=""
          width={28}
          height={28}
          className="shrink-0"
        />
        <span
          className="font-zen max-w-[7.5rem] truncate text-base leading-none text-[#F8F6E7]"
          title={nick}
        >
          {nick}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ClockDigit value={hours[0]} />
        <ClockDigit value={hours[1]} />
        <div className="mx-0.5 flex flex-col gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[#F8F6E7]" />
          <span className="h-2 w-2 rounded-full bg-[#F8F6E7]" />
        </div>
        <ClockDigit value={minutes[0]} />
        <ClockDigit value={minutes[1]} />
      </div>
    </div>
  );
}
