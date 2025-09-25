import React from 'react';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  const size = 48;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return 'text-green-600';
    if (s >= 40) return 'text-amber-500';
    return 'text-red-600';
  };
  
  const getTrackColor = (s: number) => {
    if (s >= 70) return 'stroke-green-600/20';
    if (s >= 40) return 'stroke-amber-500/20';
    return 'stroke-red-600/20';
  };

  const getStrokeColor = (s: number) => {
    if (s >= 70) return 'stroke-green-600';
    if (s >= 40) return 'stroke-amber-500';
    return 'stroke-red-600';
  }

  const colorClass = getColor(score);
  const trackColorClass = getTrackColor(score);
  const strokeColorClass = getStrokeColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size}>
        <circle
          className={trackColorClass}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${strokeColorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <span className={`text-lg font-bold ${colorClass}`}>{score}</span>
    </div>
  );
};

export default ScoreDisplay;