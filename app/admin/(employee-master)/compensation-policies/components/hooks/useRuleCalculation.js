"use client";

import { useCallback } from "react";

export default function useRuleCalculation({
  form = {},
  tiers = [],
  testAmount = "",
}) {
  const calculatePreview = useCallback(() => {
    const amount = Number(testAmount || 0);

    if (!amount) {
      return 0;
    }

    switch (form.calculation_method) {
      case "fixed":
        return Number(form.fixed_amount || 0);

      case "percent":
        return (
          amount *
          Number(form.percent || 0)
        ) / 100;

      case "tier": {

        const matched = tiers.find((tier) => {

          const from = Number(
            tier.from || 0
          );

          const to =
            tier.to === ""
              ? Infinity
              : Number(tier.to);

          return (
            amount >= from &&
            amount <= to
          );
        });

        if (!matched) {
          return 0;
        }

        if (
          matched.value_type === "percent"
        ) {
          return (
            amount *
            Number(
              matched.value || 0
            )
          ) / 100;
        }

        return Number(
          matched.value || 0
        );
      }

      default:
        return 0;
    }
  }, [
    form.calculation_method,
    form.fixed_amount,
    form.percent,
    tiers,
    testAmount,
  ]);

  return calculatePreview;
}