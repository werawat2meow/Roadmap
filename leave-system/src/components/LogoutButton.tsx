"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";   // ⬅️ เพิ่มบรรทัดนี้

export default function LogoutButton() {
  const [open, setOpen] = useState(false);

  // const doLogout = async () => {
  //   setOpen(false);
  //   await signOut({ redirect: true, callbackUrl: "/login" });
  // };

  const doLogout = async () => {
  setOpen(false);
    window.location.href = `${process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000"}/admin`;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl font-semibold text-[#001418]
                   bg-gradient-to-r from-[#ff3c3c] to-[#ff6b6b]
                   shadow-[0_0_12px_rgba(255,60,60,.6),0_0_24px_rgba(255,60,60,.4)]
                   hover:scale-105 active:scale-95 transition-transform duration-150 shrink-0 cursor-pointer"
      >
        Logout
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm"
          role="dialog" aria-modal="true"
        >
          <div className="w-[92vw] max-w-sm rounded-2xl p-5 neon-card">
            <h3 className="neon-title mb-3 text-base font-semibold">ยืนยันการออกจากระบบ</h3>
            <p className="text-sm text-[var(--muted)] mb-5">คุณต้องการออกจากระบบตอนนี้หรือไม่?</p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost">ยกเลิก</button>
              <button onClick={doLogout}
                className="rounded-xl px-4 py-2 font-semibold bg-[var(--cyan)] text-[#001418]
                           shadow-[0_10px_28px_var(--cyan-soft)]">
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
