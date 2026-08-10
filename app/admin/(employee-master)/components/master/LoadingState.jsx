"use client";

import LoadingOrb from "../LoadingOrb";

export default function LoadingState({
  loading = false,

  children,

  fallback,
}) {
  if (loading) {
    return (
      fallback || <LoadingOrb />
    );
  }

  return children;
}