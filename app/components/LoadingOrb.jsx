"use client";

import "./LoadingOrb.css";

export default function LoadingOrb({ classNameName = "" }) {
  return (
    <div className="flex min-h-screen items-center justify-center onloadding">
      <div className="loader"></div>
    </div>
  );
}