"use client";

export default function PortalShell({
  children,
}) {
  return (
    <div
      className="
        w-full
        min-w-0
        max-w-full
      "
    >
      {children}
    </div>
  );
}