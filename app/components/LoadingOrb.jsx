"use client";

import "./LoadingOrb.css";

export default function LoadingOrb({ classNameName = "" }) {
  return (
    <div className="flex min-h-screen items-center justify-center onloadding">
      <div className="progress">
        <div className="bar"></div>
      </div>
    </div>
  );
}