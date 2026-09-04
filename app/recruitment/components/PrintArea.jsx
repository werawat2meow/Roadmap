"use client";

import { useEffect } from "react";

export default function PrintArea({
  children,
  className = "",
  title = "",
}) {
  useEffect(() => {
    const handleAfterPrint = () => {
      document.documentElement.removeAttribute(
        "data-print-orientation"
      );
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return (
    <div
      className={`print-area print-content ${className}`}
      data-print-title={title}
    >
      {children}
    </div>
  );
}