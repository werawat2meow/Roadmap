"use client";
import { useEffect, useState } from "react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/leave/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          window.location.href = (process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000") + "/login";
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        window.location.href = "http://localhost:3000/login";
      });
  }, []);

  if (!checked) return null;
  return <>{children}</>;
}