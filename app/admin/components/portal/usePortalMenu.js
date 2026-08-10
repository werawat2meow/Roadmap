"use client";

import {
  useContext,
} from "react";

import {
  PortalMenuContext,
} from "./PortalMenuProvider";

export default function usePortalMenu() {
  const context =
    useContext(
      PortalMenuContext
    );

  if (!context) {
    throw new Error(
      "usePortalMenu ต้องใช้งานภายใน PortalMenuProvider"
    );
  }

  return context;
}