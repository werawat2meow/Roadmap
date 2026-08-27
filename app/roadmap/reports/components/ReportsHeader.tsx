"use client";

type Props = {
  quarter: string;
  scope: string;
  onQuarterChange: (value: string) => void;
  onScopeChange: (value: string) => void;
  onExport: () => void;
};

export default function ReportsHeader({
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    </div>
  );
}