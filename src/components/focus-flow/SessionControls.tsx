
import type React from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, RotateCcwIcon, CheckCircleIcon } from 'lucide-react';

interface SessionControlsProps {
  isActive: boolean;
  // isPaused is kept for potential future system-level pauses, though user cannot pause.
  isPaused: boolean; 
  onStartPause: () => void;
  onReset: () => void;
}

export function SessionControls({ isActive, isPaused, onStartPause, onReset }: SessionControlsProps): React.JSX.Element {
  return (
    <div className="flex justify-center space-x-4 py-4">
      <Button
        onClick={onStartPause}
        size="lg"
        className="w-36 text-lg" 
        disabled={isActive} // Disabled if session is active
        aria-label={isActive ? "Session is active" : "Start session"}
      >
        {isActive ? <CheckCircleIcon className="mr-2 h-5 w-5" /> : <PlayIcon className="mr-2 h-5 w-5" />}
        {isActive ? 'Session Active' : 'Start'}
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        className="w-36 text-lg"
        disabled={isActive} // Ensure reset button is disabled if session is active
        aria-label="Reset session"
      >
        <RotateCcwIcon className="mr-2 h-5 w-5" />
        Reset
      </Button>
    </div>
  );
}

