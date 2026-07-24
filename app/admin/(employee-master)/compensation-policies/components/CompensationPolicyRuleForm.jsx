"use client";

import { useState } from "react";
import { CalculatorIcon } from "@heroicons/react/24/outline";

import { FormSection } from "./shared";

import RuleBasicSection from "./rule/RuleBasicSection";
import CalculationSection from "./rule/CalculationSection";
import TierBuilder from "./rule/TierBuilder";
import LiveCalculationPreview from "./rule/LiveCalculationPreview";
import RuleSummary from "./rule/RuleSummary";
import CalculationOptionsSection from "./rule/CalculationOptionsSection";

import useTierBuilder from "./hooks/useTierBuilder";
import useTierValidation from "./hooks/useTierValidation";
import useRuleCalculation from "./hooks/useRuleCalculation";


export default function CompensationPolicyRuleForm({
  form = {},
  onChange,
}) {
  const [testAmount, setTestAmount] = useState("");

  const handleChange = (field, value) => {
    if (typeof onChange !== "function") return;

    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const tiers = form.tiers || [];

  const {
    addTier,
    updateTier,
    removeTier,
    duplicateTier,
    moveTier,
  } = useTierBuilder(
    tiers,
    handleChange
  );

  const tierErrors =
    useTierValidation(tiers);

  const calculatePreview =
    useRuleCalculation({
      form,
      tiers,
      testAmount,
    });

  return (
    <div className="space-y-8">

      <FormSection
        title="Compensation Rule"
        description="กำหนดวิธีการคำนวณค่าตอบแทน"
        icon={
          <CalculatorIcon className="h-6 w-6" />
        }
        iconClassName="bg-emerald-600"
      >

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RuleBasicSection
  form={form}
  onChange={handleChange}
/>

<CalculationSection
  form={form}
  onChange={handleChange}
/>

{form.calculation_method === "tier" && (
  <TierBuilder
    tiers={tiers}
    tierErrors={tierErrors}
    addTier={addTier}
    updateTier={updateTier}
    removeTier={removeTier}
    duplicateTier={duplicateTier}
    moveTier={moveTier}
  />
)}

<LiveCalculationPreview
  testAmount={testAmount}
  setTestAmount={setTestAmount}
  calculatePreview={calculatePreview}
/>

<RuleSummary
  form={form}
  tiers={tiers}
/>

<CalculationOptionsSection
  form={form}
  onChange={handleChange}
/>
                </div>

      </FormSection>

    </div>
  );
}