import EvaluationSection from './EvaluationSection';
import { Building, Users, Target } from 'lucide-react';

const companyGround = {
  items: [
    { id: 1, topic: 'Company Policy', weight: 25, score: 4 },
    { id: 2, topic: 'Department Policy', weight: 25, score: 4 },
    { id: 3, topic: 'Primary - Secondary Product และครูผู้ต้องเรียนรู้', weight: 25, score: 4 },
    { id: 4, topic: 'Proper Equipment Usage', weight: 25, score: 4 },
  ],
  totalWeight: 100,
  totalScore: 85,
  level: 'P4'
};

const departmentGround = {
    items: [
        { id: 1, topic: 'Answer Walk-in reservation inquiries correctly', weight: 20, score: 5 },
        { id: 2, topic: 'Use walkie-talkie properly', weight: 20, score: 5 },
        { id: 3, topic: 'Manage walk-in queues', weight: 20, score: 5 },
        { id: 4, topic: 'Verify RSVN system advance bookings', weight: 20, score: 4 },
        { id: 5, topic: 'Provide menu and promo information accuratly', weight: 20, score: 5 },
    ],
    totalWeight: 100,
    totalScore: 24,
    level: 'P4'
};

const expectations = {
    items: [
        { id: 1, topic: 'Problem Solving & Coordination', weight: 20, score: 4 },
        { id: 2, topic: 'Multi-task / Replace Staff', weight: 20, score: 4 },
        { id: 3, topic: 'Responsibility & Decision Making', weight: 20, score: 5 },
    ],
    totalWeight: 60,
    totalScore: 13, // Example score
    level: 'P4'
};


export default function EvaluationForm() {
  return (
    <div>
      <EvaluationSection title="Company Common Ground" icon={<Building size={20} />} {...companyGround} />
      <EvaluationSection title="Department Common Ground" icon={<Users size={20} />} {...departmentGround} />
      <EvaluationSection title="Expectations" icon={<Target size={20} />} {...expectations} />
    </div>
  );
}