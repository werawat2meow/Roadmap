"use client";
import EvaluationHistoryPanel from "./EvaluationHistoryPanel";

type Props = {
  activeTab: string;
  quarter: string;
  scope: string;
};

export default function ReportPanel({ activeTab, quarter, scope }: Props) {
  switch (activeTab) {
    case "probation":
    case "performance":
    case "promote":
    case "progression":
      return <EvaluationHistoryPanel evaluationType={activeTab} />;
    default:
      return <EvaluationHistoryPanel evaluationType="probation" />;
  }
}