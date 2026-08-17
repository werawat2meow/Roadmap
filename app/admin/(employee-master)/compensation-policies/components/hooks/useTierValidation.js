"use client";

import { useMemo } from "react";

export default function useTierValidation(
  tiers = []
) {
  const tierErrors = useMemo(() => {
    const errors = [];

    const sorted = [...tiers].sort(
      (a, b) =>
        Number(a.from || 0) -
        Number(b.from || 0)
    );

    sorted.forEach((tier, index) => {

      if (
        tier.from === "" ||
        tier.value === ""
      ) {
        errors.push(
          `Tier ${index + 1} ยังไม่ครบข้อมูล`
        );
      }

      if (
        tier.to !== "" &&
        Number(tier.to) <
          Number(tier.from)
      ) {
        errors.push(
          `Tier ${index + 1} : To ต้องมากกว่า From`
        );
      }

      if (index > 0) {

        const prev = sorted[index - 1];

        if (
          prev.to !== "" &&
          Number(tier.from) <=
            Number(prev.to)
        ) {
          errors.push(
            `Tier ${index + 1} ช่วงข้อมูลซ้อนกัน`
          );
        }

      }

    });

    return errors;

  }, [tiers]);

  return tierErrors;
}