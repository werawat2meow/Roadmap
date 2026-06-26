import EvaluationSection from './EvaluationSection';
import { Target, Users, Gem } from 'lucide-react';

const kpiTargets = {
  items: [
    { id: 1, topic: 'Monthly Revenue Target', weight: 30, score: 4 },
    { id: 2, topic: 'Customer Satisfaction Score', weight: 25, score: 5 },
    { id: 3, topic: 'Team Productivity Index', weight: 25, score: 4 },
    { id: 4, topic: 'Process Improvement', weight: 20, score: 3 },
  ],
  totalWeight: 100,
  totalScore: 88,
  level: 'P4',
};

const behavioralCompetency = {
  items: [
    { id: 1, topic: 'Communication Skills', weight: 25, score: 5 },
    { id: 2, topic: 'Teamwork & Collaboration', weight: 25, score: 4 },
    { id: 3, topic: 'Problem Solving', weight: 25, score: 4 },
    { id: 4, topic: 'Initiative & Leadership', weight: 25, score: 3 },
  ],
  totalWeight: 100,
  totalScore: 80,
  level: 'P4',
};

const coreValues = {
  items: [
    { id: 1, topic: 'Integrity', weight: 34, score: 5 },
    { id: 2, topic: 'Innovation', weight: 33, score: 4 },
    { id: 3, topic: 'Excellence', weight: 33, score: 4 },
  ],
  totalWeight: 100,
  totalScore: 76,
  level: 'P4',
};

export default function PerformanceForm() {
  return (
    <div>
      <EvaluationSection
        title="KPI & Targets"
        icon={<Target size={20} />}
        {...kpiTargets}
      />
      <EvaluationSection
        title="Behavioral Competency"
        icon={<Users size={20} />}
        {...behavioralCompetency}
      />
      <EvaluationSection
        title="Core Values"
        icon={<Gem size={20} />}
        {...coreValues}
      />
    </div>
  );
}