// src/pages/Home.jsx

"use client";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#191919]">
      <div className="relative z-20 flex h-full flex-col items-start justify-center select-none">
        <div className="ml-25">
          <h1 className="font-bold text-[#F8F6E7] font-amatic text-5xl">
            КЗР
          </h1>
          <h2 className="text-2xl text-[#F8F6E7] font-zen">
            Планируй. Учись. Работай. Добивайся успеха
          </h2>
          <div className="flex gap-4 mt-5">
            <Button_Start />
            <Button_About_Us />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%]">
        <div className="absolute top-[10%] right-[8%] z-0 h-125 w-125 bg-gradient-to-r from-[#191919] to-[#49644E]" />
        <div className="absolute top-[25%] right-[22%] z-10 h-125 w-125 bg-gradient-to-r from-[#191919] to-[#F8F6E7]" />
      </div>
    </div>
  );
}

function Button_Start() {
  return (
    <Link
      href="/registration_and_in"
      className="
        flex items-center justify-start w-[40%] h-10
        bg-[#F8F6E7] text-left text-[#191919] p-2
        rounded-[3px] border border-[#F8F6E7]
        shadow-[4px_4px_0_0_#49644E]
        text-2xl
        transition-all duration-150 ease-out
        hover:translate-x-[2px] hover:translate-y-[2px]
        hover:shadow-[2px_2px_0_0_#49644E]
        active:translate-x-[4px] active:translate-y-[4px]
        active:shadow-[0_0_0_0_#49644E]
        active:bg-[#D6D3C2]
        cursor-pointer
      "
    >
      Начать
    </Link>
  );
}

function Button_About_Us() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="
          flex items-center w-[20%] h-10 bg-transparent text-left text-[#F8F6E7] border border-[#F8F6E7] shadow-[4px_4px_0_0_#49644E] p-2 rounded-[3px] text-2xl
          transition-all duration-150 ease-out
          hover:translate-x-[2px] hover:translate-y-[2px] 
          hover:shadow-[2px_2px_0_0_#49644E]
          active:translate-x-[4px] active:translate-y-[4px] 
          active:shadow-[0_0_0_0_#49644E]
          active:bg-[#49644E]
      ">
        О нас
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/60 backdrop-blur-sm
            transition-opacity duration-200
          "
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              bg-[#F8F6E7] text-[#49644E] 
              border-2 border-[#49644E] 
              rounded-[3px] 
              px-12 py-8 
              text-3xl font-bold
            "
          >
            Ананас
          </div>
        </div>
      )}
    </>
  );
}
