'use client';

import EvaluationReportPanel from './EvaluationReportPanel';
import KpiReportPanel from './KpiReportPanel';
import PromotionReportPanel from './PromotionReportPanel';
import RoadmapReportPanel from './RoadmapReportPanel';
import EmployeeReportPanel from './EmployeeReportPanel';
import SettingsReportPanel from './SettingsReportPanel';

type Props = {
  activeTab: string;
  quarter: string;
  scope: string;
};

export default function ReportPanel({ activeTab, quarter, scope }: Props) {
  switch (activeTab) {
    case 'evaluation':
      return <EvaluationReportPanel quarter={quarter} scope={scope} />;
    case 'kpi':
      return <KpiReportPanel quarter={quarter} scope={scope} />;
    case 'promotion':
      return <PromotionReportPanel quarter={quarter} scope={scope} />;
    case 'roadmap':
      return <RoadmapReportPanel quarter={quarter} scope={scope} />;
    case 'employee':
      return <EmployeeReportPanel quarter={quarter} scope={scope} />;
    case 'settings':
      return <SettingsReportPanel quarter={quarter} scope={scope} />;
    default:
      return <EvaluationReportPanel quarter={quarter} scope={scope} />;
  }
}