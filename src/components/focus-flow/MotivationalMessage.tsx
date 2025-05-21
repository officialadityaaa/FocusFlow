import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SparklesIcon, Loader2 } from 'lucide-react';

interface MotivationalMessageProps {
  message: string | null;
  isLoading: boolean;
  error: string | null;
}

export function MotivationalMessage({ message, isLoading, error }: MotivationalMessageProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Card className="bg-accent/50 border-accent min-h-[80px] flex items-center justify-center shadow-inner">
        <CardContent className="p-4 text-center text-accent-foreground">
          <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
          <p className="inline-block">Fetching a motivational boost...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/20 border-destructive min-h-[80px] flex items-center justify-center shadow-inner">
        <CardContent className="p-4 text-center text-destructive-foreground">
          <p>Could not load a prompt: {error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!message) {
    return (
       <Card className="bg-secondary min-h-[80px] flex items-center justify-center shadow-inner">
        <CardContent className="p-4 text-center text-secondary-foreground">
          <p>Start your session to get a motivational prompt!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-accent/50 border-accent min-h-[80px] flex items-center justify-center shadow-inner">
      <CardContent className="p-4 text-center text-accent-foreground">
        <SparklesIcon className="h-5 w-5 inline-block mr-2 mb-1 text-primary" />
        <p className="italic">"{message}"</p>
      </CardContent>
    </Card>
  );
}
