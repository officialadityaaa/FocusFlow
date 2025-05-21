import type React from 'react';

interface TimerDisplayProps {
  timeRemainingSeconds: number;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function TimerDisplay({ timeRemainingSeconds }: TimerDisplayProps): React.JSX.Element {
  return (
    <div className="text-center">
      <p className="text-7xl font-mono font-bold text-primary tabular-nums">
        {formatTime(timeRemainingSeconds)}
      </p>
    </div>
  );
}
