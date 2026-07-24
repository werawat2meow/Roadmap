"use client";

export default function useTierBuilder(
  tiers,
  handleChange
) {

  const addTier = () => {
    handleChange("tiers", [
      ...tiers,
      {
        id: crypto.randomUUID(),
        from: "",
        to: "",
        value: "",
        value_type: "fixed",
      },
    ]);
  };

  const updateTier = (
    index,
    field,
    value
  ) => {

    const next = [...tiers];

    next[index] = {
      ...next[index],
      [field]: value,
    };

    handleChange("tiers", next);
  };

  const removeTier = (index) => {

    handleChange(
      "tiers",
      tiers.filter((_, i) => i !== index)
    );

  };

  const duplicateTier = (index) => {

    const tier = tiers[index];

    handleChange("tiers", [
      ...tiers,
      {
        ...tier,
        id: crypto.randomUUID(),
      },
    ]);

  };

  const moveTier = (
    fromIndex,
    toIndex
  ) => {

    if (
      toIndex < 0 ||
      toIndex >= tiers.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const next = [...tiers];

    const [item] = next.splice(
      fromIndex,
      1
    );

    next.splice(toIndex, 0, item);

    handleChange("tiers", next);
  };

  return {
    addTier,
    updateTier,
    removeTier,
    duplicateTier,
    moveTier,
  };
}