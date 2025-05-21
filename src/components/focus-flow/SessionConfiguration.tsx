
import type React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

interface SessionConfigurationProps {
  sessionDurationMinutes: number;
  onDurationChange: (duration: number) => void;
  pledgeAmount: number;
  onPledgeAmountChange: (amount: number) => void;
  disabled: boolean;
}

export function SessionConfiguration({ 
  sessionDurationMinutes, 
  onDurationChange, 
  pledgeAmount,
  onPledgeAmountChange,
  disabled 
}: SessionConfigurationProps): React.JSX.Element {
  const handleDurationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onDurationChange(value);
    } else if (event.target.value === "") {
      onDurationChange(1); 
    }
  };

  const handlePledgeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      onPledgeAmountChange(value);
    } else if (event.target.value === "") {
      onPledgeAmountChange(0);
    }
  };
  
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Session Settings</CardTitle>
        <CardDescription>Configure your focus session and pledge.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="session-duration" className="text-base">Focus Duration (minutes)</Label>
          <Input
            id="session-duration"
            type="number"
            value={sessionDurationMinutes}
            onChange={handleDurationInputChange}
            min="1"
            className="text-base"
            disabled={disabled}
            aria-describedby="session-duration-description"
          />
          <p id="session-duration-description" className="text-sm text-muted-foreground">
            Set how long each focus session will last.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pledge-amount" className="text-base">Pledge Amount (e.g., $, points)</Label>
          <Input
            id="pledge-amount"
            type="number"
            value={pledgeAmount}
            onChange={handlePledgeInputChange}
            min="0"
            className="text-base"
            disabled={disabled}
            aria-describedby="pledge-amount-description"
          />
          <p id="pledge-amount-description" className="text-sm text-muted-foreground">
            Set a symbolic amount. If you break focus rules, this pledge is "forfeited".
          </p>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Pledge via UPI (Simulation)</CardTitle>
            <CardDescription className="text-xs">
              This is a demonstration. No real payment will be processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-2">
            <div className="p-2 border rounded-md bg-white">
              <Image 
                src="https://placehold.co/150x150.png?text=Scan+UPI+QR" 
                alt="Simulated UPI QR Code" 
                width={150} 
                height={150}
                data-ai-hint="QR code" 
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan this placeholder QR with a UPI app to simulate making your pledge.
            </p>
          </CardContent>
        </Card>

      </CardContent>
    </Card>
  );
}
