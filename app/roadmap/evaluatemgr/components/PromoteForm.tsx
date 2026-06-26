import EvaluationSection from './EvaluationSection';
import { Briefcase, BarChart3, Award } from 'lucide-react';

const leadershipReadiness = {
  items: [
    { id: 1, topic: 'Team Management Capability', weight: 30, score: 5 },
    { id: 2, topic: 'Decision Making Under Pressure', weight: 25, score: 4 },
    { id: 3, topic: 'Conflict Resolution', weight: 25, score: 4 },
    { id: 4, topic: 'Vision & Strategic Alignment', weight: 20, score: 4 },
  ],
  totalWeight: 100,
  totalScore: 88,
  level: 'P4',
};

const performanceTrackRecord = {
    items: [
        { id: 1, topic: 'Consecutive High-Performance Cycles', weight: 25, score: 5 },
        { id: 2, topic: 'Target Achievement Rate', weight: 25, score: 5 },
        { id: 3, topic: 'Peer Recognition', weight: 25, score: 4 },
        { id: 4, topic: '360° Feedback Score', weight: 25, score: 4 },  
    ],
    totalWeight: 100,
    totalScore: 92,
    level: 'P4',
};

const promotionCriteria = {
  items: [
    { id: 1, topic: 'Minimum Years in Role', weight: 30, score: 5 },
    { id: 2, topic: 'Succession Plan Fit', weight: 40, score: 4 },
    { id: 3, topic: 'HR Recommendation', weight: 30, score: 4 },
  ],
  totalWeight: 100,
  totalScore: 85,
  level: 'P4',
};

export default function PromoteForm() {
  return (
    <div>
        <EvaluationSection 
            title="Leadership Readiness"
            icon={<Briefcase size={20} />}
            {...leadershipReadiness}
        />
        <EvaluationSection 
            title="Performance Track Record"
            icon={<BarChart3 size={20} />}
            {...performanceTrackRecord}
        />
        <EvaluationSection 
            title="Promotion Criteria"
            icon={<Award size={20} />}
            {...promotionCriteria}
        />
    </div>
  );
}