"use client";

import ReportPreviewModal from "../../evaluate/components/ReportPreviewModal";

type EvaluationPreviewModalProps = {
  open: boolean;
  data: any | null;
  onClose: () => void;
};

export default function EvaluationPreviewModal({
  open,
  data,
  onClose,
}: EvaluationPreviewModalProps) {
  if (!open || !data) return null;

  return <ReportPreviewModal isOpen={open} onClose={onClose} data={data} />;
}
