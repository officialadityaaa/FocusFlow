
import type React from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, RotateCcwIcon, CheckCircleIcon } from 'lucide-react';

interface SessionControlsProps {
  isSessionPrimed: boolean;
  isTimerActive: boolean; // Added to differentiate between primed and actively running
  onStartSession: () => void;
  onReset: () => void;
}

export function SessionControls({ 
  isSessionPrimed, 
  isTimerActive, 
  onStartSession, 
  onReset 
}: SessionControlsProps): React.JSX.Element {
  return (
    <div className="flex justify-center space-x-4 py-4">
      <Button
        onClick={onStartSession}
        size="lg"
        className="w-36 text-lg" 
        disabled={isSessionPrimed} 
        aria-label={isSessionPrimed ? (isTimerActive ? "Session Active" : "Session Primed - Resume by meeting conditions") : "Start session"}
      >
        {isSessionPrimed ? <CheckCircleIcon className="mr-2 h-5 w-5" /> : <PlayIcon className="mr-2 h-5 w-5" />}
        {isSessionPrimed ? (isTimerActive ? 'Active' : 'Primed') : 'Start'}
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        className="w-36 text-lg"
        aria-label="Reset session"
      >
        <RotateCcwIcon className="mr-2 h-5 w-5" />
        Reset
      </Button>
    </div>
  );
}
