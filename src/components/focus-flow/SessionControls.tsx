import type React from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon, RotateCcwIcon } from 'lucide-react';

interface SessionControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onStartPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function SessionControls({ isActive, isPaused, onStartPause, onReset, disabled }: SessionControlsProps): React.JSX.Element {
  return (
    <div className="flex justify-center space-x-4 py-4">
      <Button
        onClick={onStartPause}
        size="lg"
        className="w-32 text-lg"
        disabled={disabled}
        aria-label={isActive && !isPaused ? "Pause session" : "Start session"}
      >
        {isActive && !isPaused ? <PauseIcon className="mr-2 h-5 w-5" /> : <PlayIcon className="mr-2 h-5 w-5" />}
        {isActive && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Start'}
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        className="w-32 text-lg"
        disabled={disabled && !isActive && !isPaused} // Allow reset if timer was active or paused, even if config is open
        aria-label="Reset session"
      >
        <RotateCcwIcon className="mr-2 h-5 w-5" />
        Reset
      </Button>
    </div>
  );
}
