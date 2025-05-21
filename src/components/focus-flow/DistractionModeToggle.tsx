import type React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BellOffIcon } from 'lucide-react';

interface DistractionModeToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function DistractionModeToggle({ isEnabled, onToggle }: DistractionModeToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex items-center space-x-2">
        <BellOffIcon className={`h-5 w-5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
        <Label htmlFor="distraction-mode" className="text-base">
          Do Not Disturb Mode
        </Label>
      </div>
      <Switch
        id="distraction-mode"
        checked={isEnabled}
        onCheckedChange={onToggle}
        aria-label="Toggle Do Not Disturb Mode"
      />
    </div>
  );
}
