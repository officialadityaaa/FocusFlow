
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SettingsIcon, XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTimer } from '@/hooks/useTimer';
import { useScreenVisibility } from '@/hooks/useScreenVisibility';
import { generateMotivationalPrompt, type MotivationalPromptInput } from '@/ai/flows/motivational-prompt';

import { TimerDisplay } from './TimerDisplay';
import { ProgressDisplay } from './ProgressDisplay';
import { SessionControls } from './SessionControls';
import { SessionConfiguration } from './SessionConfiguration';
import { MotivationalMessage } from './MotivationalMessage';
import { DistractionModeToggle } from './DistractionModeToggle';
import { ScreenProctorDisplay } from './ScreenProctorDisplay';
import { YouTubePlayer } from './YouTubePlayer';
import { PdfViewer } from './PdfViewer';

const DEFAULT_SESSION_DURATION_MINUTES = 25;
const PROMPT_FETCH_INTERVAL_MINUTES = 5; // Fetch prompt every 5 minutes of elapsed time

export default function FocusFlowApp(): React.JSX.Element {
  const { toast } = useToast();
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(DEFAULT_SESSION_DURATION_MINUTES);
  
  const handleTimerEnd = useCallback(() => {
    toast({
      title: "Session Complete!",
      description: `You've completed a ${sessionDurationMinutes}-minute focus session. Great job!`,
    });
    setMotivationalMessage("Session Complete! Well done.");
  }, [sessionDurationMinutes, toast]);

  const {
    timeRemainingSeconds,
    isActive,
    isPaused,
    elapsedInSessionSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    setDuration,
  } = useTimer({ 
    initialDurationSeconds: sessionDurationMinutes * 60,
    onEnd: handleTimerEnd,
  });

  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [distractionModeEnabled, setDistractionModeEnabled] = useState(false);
  const isTabActive = useScreenVisibility();
  const [showSettings, setShowSettings] = useState(false);
  const [lastPromptFetchTime, setLastPromptFetchTime] = useState(0);

  // Effect to pause timer when tab becomes inactive
  useEffect(() => {
    if (!isTabActive && isActive && !isPaused) {
      pauseTimer();
      toast({
        title: "Timer Paused",
        description: "Focus session paused because you switched tabs.",
        duration: 5000, // Show for 5 seconds
      });
    }
  }, [isTabActive, isActive, isPaused, pauseTimer, toast]);

  useEffect(() => {
    setDuration(sessionDurationMinutes * 60);
    if (!isActive) { 
      setMotivationalMessage(null);
    }
  }, [sessionDurationMinutes, setDuration, isActive]);

  const fetchPrompt = useCallback(async () => {
    if (isFetchingPrompt) return;
    setIsFetchingPrompt(true);
    setPromptError(null);
    try {
      const input: MotivationalPromptInput = {
        sessionDuration: sessionDurationMinutes,
        timeElapsed: Math.floor(elapsedInSessionSeconds / 60),
      };
      const result = await generateMotivationalPrompt(input);
      setMotivationalMessage(result.prompt);
      setLastPromptFetchTime(elapsedInSessionSeconds);
    } catch (error) {
      console.error("Failed to fetch motivational prompt:", error);
      setPromptError("Could not load a prompt. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch motivational prompt.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPrompt(false);
    }
  }, [sessionDurationMinutes, elapsedInSessionSeconds, isFetchingPrompt, toast]);

  useEffect(() => {
    if (isActive && !isPaused && isTabActive) { // Only fetch/update prompts if tab is active
      if (elapsedInSessionSeconds === 0 && !motivationalMessage) { 
        fetchPrompt();
      } else {
        const elapsedMinutes = Math.floor(elapsedInSessionSeconds / 60);
        const lastFetchElapsedMinutes = Math.floor(lastPromptFetchTime / 60);
        if (elapsedMinutes > 0 && elapsedMinutes % PROMPT_FETCH_INTERVAL_MINUTES === 0 && elapsedMinutes > lastFetchElapsedMinutes) {
          fetchPrompt();
        }
      }
    }
  }, [isActive, isPaused, isTabActive, elapsedInSessionSeconds, fetchPrompt, motivationalMessage, lastPromptFetchTime]);
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (distractionModeEnabled) {
        document.title = "DO NOT DISTURB - FocusFlow";
      } else {
        document.title = "FocusFlow";
      }
    }
  }, [distractionModeEnabled]);

  const handleStartPause = () => {
    if (isActive && !isPaused) {
      pauseTimer();
    } else {
      startTimer();
      if (!isTabActive) {
         toast({
            title: "Tab Inactive",
            description: "Timer started, but the tab is not active. Switch back to this tab to see progress.",
            variant: "default",
            duration: 7000,
          });
      }
      if (!motivationalMessage && !promptError && elapsedInSessionSeconds === 0 && isTabActive) {
        fetchPrompt();
      }
    }
  };

  const handleReset = () => {
    resetTimer(sessionDurationMinutes * 60);
    setMotivationalMessage(null);
    setPromptError(null);
    setLastPromptFetchTime(0);
  };

  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
    if (!isActive) {
        resetTimer(newDuration * 60);
        setMotivationalMessage(null);
        setPromptError(null);
        setLastPromptFetchTime(0);
    }
  };

  const toggleSettings = () => setShowSettings(!showSettings);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 selection:bg-primary/20 selection:text-primary-foreground">
      <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-card">
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-semibold text-primary">
              FocusFlow
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={toggleSettings} aria-label={showSettings ? "Close settings" : "Open settings"}>
              {showSettings ? <XIcon className="h-6 w-6" /> : <SettingsIcon className="h-6 w-6" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 pt-4">
          {showSettings ? (
            <SessionConfiguration
              sessionDurationMinutes={sessionDurationMinutes}
              onDurationChange={handleDurationChange}
              disabled={isActive} 
            />
          ) : (
            <div className="space-y-6">
              <TimerDisplay timeRemainingSeconds={timeRemainingSeconds} />
              <ProgressDisplay
                timeRemainingSeconds={timeRemainingSeconds}
                sessionDurationSeconds={sessionDurationMinutes * 60}
              />
              <MotivationalMessage message={motivationalMessage} isLoading={isFetchingPrompt} error={promptError} />
              <SessionControls
                isActive={isActive}
                isPaused={isPaused}
                onStartPause={handleStartPause}
                onReset={handleReset}
              />
              
              <Separator className="my-4" /> 
              
              <div className="space-y-4">
                <YouTubePlayer />
                <PdfViewer />
              </div>

            </div>
          )}
          <Separator />
          <div className="space-y-4">
            <DistractionModeToggle
              isEnabled={distractionModeEnabled}
              onToggle={setDistractionModeEnabled}
            />
            <ScreenProctorDisplay isTabActive={isTabActive} />
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/50 p-4">
          <p className="text-xs text-muted-foreground text-center w-full">
            {isTabActive ? "Stay focused, achieve more." : "Warning: Tab lost focus. Return to stay on track!"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
