import type React from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface ScreenProctorDisplayProps {
  isTabActive: boolean;
}

export function ScreenProctorDisplay({ isTabActive }: ScreenProctorDisplayProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
       <div className="flex items-center space-x-2">
        {isTabActive ? (
          <EyeIcon className="h-5 w-5 text-green-500" />
        ) : (
          <EyeOffIcon className="h-5 w-5 text-red-500" />
        )}
        <p className="text-base">
          Screen Focus: <span className={isTabActive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{isTabActive ? 'Active' : 'Inactive'}</span>
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {isTabActive ? "You're on the right tab!" : "Return to FocusFlow tab!"}
      </p>
    </div>
  );
}
