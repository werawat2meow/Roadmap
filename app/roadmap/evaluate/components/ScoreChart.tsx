'use client';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

type ScoreChartProps = {
  score: number;
};

export default function ScoreChart({ score }: ScoreChartProps) {
  return (
    <div style={{ width: 120, height: 120 }}>
      <CircularProgressbar
        value={score}
        text={`${score}%`}
        styles={buildStyles({
          strokeLinecap: 'round',
          textSize: '20px',
          pathTransitionDuration: 0.5,
          pathColor: `rgba(34, 197, 94, ${score / 100})`,
          textColor: '#1f2937',
          trailColor: '#e5e7eb',
          backgroundColor: '#3e98c7',
        })}
      />
      <p className="text-center text-sm text-gray-500 mt-1">Grade</p>
    </div>
  );
}