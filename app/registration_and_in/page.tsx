"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-70 h-10 rounded-[3px] border border-[#F8F6E7] bg-[#191919] p-2 text-1xl text-[#F8F6E7] transition-all duration-200 hover:bg-[#222222] focus:bg-[#222222] focus:outline-none focus:border-[#49644E] focus:shadow-[4px_4px_0_0_#49644E]";

const primaryButtonClassName = `
  flex h-10 w-[80%] items-center justify-start rounded-[3px]
  border border-[#F8F6E7] bg-[#F8F6E7] p-2 text-left text-2xl text-[#191919]
  shadow-[4px_4px_0_0_#49644E] transition-all duration-150 ease-out
  hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#49644E]
  active:translate-x-[4px] active:translate-y-[4px] active:bg-[#D6D3C2] active:shadow-[0_0_0_0_#49644E]
  disabled:cursor-not-allowed disabled:opacity-60
`;

const backButtonClassName = `
  flex h-10 w-10 items-center justify-center rounded-[3px]
  border border-[#F8F6E7] bg-transparent p-2 text-2xl text-[#F8F6E7]
  shadow-[4px_4px_0_0_#49644E] transition-all duration-150 ease-out
  hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#49644E]
  active:translate-x-[4px] active:translate-y-[4px] active:bg-[#49644E] active:shadow-[0_0_0_0_#49644E]
`;

export default function RegistrationAndInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setError("Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#191919]">
      <div className="flex h-full w-[45%] flex-col items-center justify-center gap-3">
        <h1 className="font-amatic text-5xl font-bold text-[#F8F6E7]">Войти</h1>
        <div className="h-0.5 w-10 bg-[#F8F6E7]" />
        <Link
          href="/registration"
          className="font-amatic text-2xl font-bold text-[#F8F6E7] transition-colors duration-200 hover:text-[#49644E]"
        >
          Зарегистрироваться
        </Link>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Введите email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            required
          />
          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            required
          />
          {error ? (
            <p className="font-zen text-sm text-red-400">{error}</p>
          ) : null}
          <div className="flex flex-row gap-4">
            <Link href="/" className={backButtonClassName}>
              <Image src="/arrow_back.svg" alt="Назад" width={24} height={24} />
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={primaryButtonClassName}
            >
              {loading ? "..." : "Войти"}
            </button>
          </div>
        </form>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%]">
        <div className="absolute top-[10%] right-[8%] z-0 h-125 w-125 bg-gradient-to-r from-[#191919] to-[#49644E]" />
        <div className="absolute top-[25%] right-[22%] z-10 h-125 w-125 bg-gradient-to-r from-[#191919] to-[#F8F6E7]" />
      </div>
    </div>
  );
}
