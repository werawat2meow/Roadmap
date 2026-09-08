"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import LangSwitch from "./LangSwitch";
import LogoutButton from "./LogoutButton";
import { useEffect, useRef, useState } from "react";

function getInitials(fullname?: string): string {
  if (!fullname) return "?";
  return fullname.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((p: string) => p.charAt(0).toUpperCase()).join("") || "?";
}

function Avatar({ name, image }: { name?: string; image?: string }) {
  const initials = getInitials(name);
  return image ? (
    <img src={image} alt="avatar" className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9" referrerPolicy="no-referrer" />
  ) : (
    <div aria-hidden className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center bg-slate-200 text-slate-700 text-xs font-semibold dark:bg-slate-700 dark:text-slate-100">
      {initials}
    </div>
  );
}

function CompactMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!ref.current || ref.current.contains(e.target as Node)) return; setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);
  return (
    <div className="relative z-[90]" ref={ref}>
      <button aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v => !v)}
        className="rounded-xl px-2 py-1 ring-1 ring-slate-300/60 dark:ring-white/10 hover:bg-white/5" title="เมนู">⋮</button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#0b1220]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AppHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/leave/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data); });
  }, []);

  const userLabel = user?.full_name ?? user?.username ?? "User";

  return (
    <header className="relative z-[80] flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
      <Link href="/dashboard" className="text-lg font-bold sm:text-xl md:text-2xl">
        Leave Management
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:hidden">
          <div className="rounded-xl px-1.5 py-1" title="โปรไฟล์ของฉัน" aria-label="โปรไฟล์ของฉัน">
            <Avatar name={userLabel} />
          </div>
          <CompactMenu>
            <div className="px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">{userLabel}</div>
            <div className="block rounded-lg px-3 py-2 text-slate-200">โปรไฟล์ของฉัน</div>
            <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center justify-between gap-2 px-2 py-2">
              <LangSwitch />
              <ThemeToggle />
            </div>
            <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />
            <div className="px-2"><LogoutButton /></div>
          </CompactMenu>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="group flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/5" title="โปรไฟล์ของฉัน">
            <Avatar name={userLabel} />
            <span className="text-sm">{userLabel}</span>
          </div>
          <LangSwitch />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}