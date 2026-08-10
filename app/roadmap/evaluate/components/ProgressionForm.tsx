import EvaluationSection from './EvaluationSection';
import { GraduationCap, TrendingUp, Rocket } from 'lucide-react';

const skillDevelopment = {
  items: [
    { id: 1, topic: 'Technical Skills Advancement', weight: 25, score: 4 },
    { id: 2, topic: 'Cross-functional Knowledge', weight: 25, score: 4 },
    { id: 3, topic: 'Certifications & Training', weight: 25, score: 3 },
    { id: 4, topic: 'Mentorship Participation', weight: 25, score: 2 },
  ],
  totalWeight: 100,
  totalScore: 82,
  level: 'P4',
};

const careerMilestones = {
  items: [
    { id: 1, topic: 'Project Completion Rate', weight: 30, score: 5 },
    { id: 2, topic: 'Role Expansion', weight: 30, score: 4 },
    { id: 3, topic: 'Stakeholder Feedback', weight: 20, score: 4 },
    { id: 4, topic: 'Attendance & Reliability', weight: 20, score: 5 },
  ],
  totalWeight: 100,
  totalScore: 91,
  level: 'P4',
};

const readinessAssessment = {
  items: [
    { id: 1, topic: 'Next-Level Competency', weight: 40, score: 4 },
    { id: 2, topic: 'Leadership Potential', weight: 35, score: 4 },
    { id: 3, topic: 'Strategic Thinking', weight: 25, score: 3 },
  ],
  totalWeight: 100,
  totalScore: 70,
  level: 'P4',
};

export default function ProgressionForm() {
  return (
    <div>
      <EvaluationSection
        title="Skill Development"
        icon={<GraduationCap size={20} />}
        {...skillDevelopment}
      />
      <EvaluationSection
        title="Career Milestones"
        icon={<TrendingUp size={20} />}
        {...careerMilestones}
      />
      <EvaluationSection
        title="Readiness Assessment"
        icon={<Rocket size={20} />}
        {...readinessAssessment}
      />
    </div>
  );
}