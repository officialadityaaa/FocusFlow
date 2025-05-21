import type React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressDisplayProps {
  timeRemainingSeconds: number;
  sessionDurationSeconds: number;
}

export function ProgressDisplay({ timeRemainingSeconds, sessionDurationSeconds }: ProgressDisplayProps): React.JSX.Element {
  const progressPercent = sessionDurationSeconds > 0 
    ? ((sessionDurationSeconds - timeRemainingSeconds) / sessionDurationSeconds) * 100 
    : 0;

  return (
    <div className="w-full px-2">
      <Progress value={Math.max(0, Math.min(100, progressPercent))} className="h-3 bg-primary/20" />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{Math.floor(progressPercent)}% complete</span>
        <span>Time Remaining: {Math.ceil(timeRemainingSeconds/60)} min</span>
      </div>
    </div>
  );
}
