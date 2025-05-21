import type React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionConfigurationProps {
  sessionDurationMinutes: number;
  onDurationChange: (duration: number) => void;
  disabled: boolean;
}

export function SessionConfiguration({ sessionDurationMinutes, onDurationChange, disabled }: SessionConfigurationProps): React.JSX.Element {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onDurationChange(value);
    } else if (event.target.value === "") {
      onDurationChange(1); // Default to 1 if input is cleared
    }
  };
  
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Session Settings</CardTitle>
        <CardDescription>Configure your focus session duration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-duration" className="text-base">Focus Duration (minutes)</Label>
          <Input
            id="session-duration"
            type="number"
            value={sessionDurationMinutes}
            onChange={handleInputChange}
            min="1"
            className="text-base"
            disabled={disabled}
            aria-describedby="session-duration-description"
          />
          <p id="session-duration-description" className="text-sm text-muted-foreground">
            Set how long each focus session will last.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
