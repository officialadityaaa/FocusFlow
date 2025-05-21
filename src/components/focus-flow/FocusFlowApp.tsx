
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
const MAX_TAB_SWITCHES = 3;
const MAX_AWAY_DURATION_MS = 2 * 60 * 1000; // 2 minutes

export default function FocusFlowApp(): React.JSX.Element {
  const { toast } = useToast();
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(DEFAULT_SESSION_DURATION_MINUTES);
  
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [distractionModeEnabled, setDistractionModeEnabled] = useState(false);
  const isTabActive = useScreenVisibility();
  const [showSettings, setShowSettings] = useState(false);
  const [lastPromptFetchTime, setLastPromptFetchTime] = useState(0);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [awayStartTime, setAwayStartTime] = useState<number | null>(null);
  const [resetSignal, setResetSignal] = useState(0); // Used to reset child components

  const handleTimerEnd = useCallback(() => {
    toast({
      title: "Session Complete!",
      description: `You've completed a ${sessionDurationMinutes}-minute focus session. Great job!`,
    });
    setMotivationalMessage("Session Complete! Well done.");
    setTabSwitchCount(0); // Reset tab switch count on session completion
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

  const handleFullReset = useCallback((reason: string) => {
    resetTimer(sessionDurationMinutes * 60);
    setMotivationalMessage(null);
    setPromptError(null);
    setLastPromptFetchTime(0);
    setTabSwitchCount(0);
    setAwayStartTime(null);
    setResetSignal(prev => prev + 1); // Trigger reset for children like YouTubePlayer/PdfViewer

    toast({
      title: "Session Reset",
      description: reason,
      variant: "destructive",
      duration: 7000,
    });
  }, [resetTimer, sessionDurationMinutes, toast]);


  // Effect for tab visibility changes and switch counting
  useEffect(() => {
    if (!isTabActive) { // Tab became inactive
      if (isActive && !isPaused) { // Only if timer was running and not manually paused
        pauseTimer();
        const newSwitchCount = tabSwitchCount + 1;
        setTabSwitchCount(newSwitchCount);
        setAwayStartTime(Date.now());

        if (newSwitchCount > MAX_TAB_SWITCHES) {
          handleFullReset(`Exceeded maximum tab switches (${MAX_TAB_SWITCHES}). Session reset.`);
        } else {
          toast({
            title: "Timer Paused",
            description: `Focus session paused. Tab switches used: ${newSwitchCount}/${MAX_TAB_SWITCHES}.`,
            duration: 5000,
          });
        }
      }
    } else { // Tab became active
      if (awayStartTime) { // Indicates we were away and timer might have been auto-paused
        const awayDuration = Date.now() - awayStartTime;
        setAwayStartTime(null); // Clear immediately

        // Check if a reset condition from MAX_AWAY_DURATION_MS was met (primarily handled by interval)
        // Or if MAX_TAB_SWITCHES was exceeded.
        // resetTimer sets isActive to false, so if a reset occurred, this block won't try to resume.
        if (isActive && isPaused && tabSwitchCount <= MAX_TAB_SWITCHES && awayDuration <= MAX_AWAY_DURATION_MS) {
          startTimer(); // Resume timer
          toast({
            title: "Timer Resumed",
            description: "Welcome back! Session resumed.",
            duration: 3000,
          });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabActive, isActive, isPaused, pauseTimer, startTimer, toast, tabSwitchCount, awayStartTime, handleFullReset]);
  // Dependencies for above useEffect: isTabActive, isActive, isPaused, pauseTimer, startTimer, toast, tabSwitchCount, awayStartTime, handleFullReset, MAX_TAB_SWITCHES, MAX_AWAY_DURATION_MS

  // Effect for checking MAX_AWAY_DURATION_MS
  useEffect(() => {
    let awayCheckInterval: NodeJS.Timeout | null = null;

    if (!isTabActive && awayStartTime && isActive) { // Timer must have been active
      awayCheckInterval = setInterval(() => {
        // Check if awayStartTime is still set (i.e., user hasn't returned)
        // and if a reset hasn't already occurred (isActive would be false)
        if (awayStartTime && isActive && (Date.now() - awayStartTime > MAX_AWAY_DURATION_MS)) {
          handleFullReset(`You were away for more than ${MAX_AWAY_DURATION_MS / 60000} minutes. Session reset.`);
          // No need to clear interval here, handleFullReset changes isActive, which cleans up this effect.
        }
      }, 1000); // Check every second
    }

    return () => {
      if (awayCheckInterval) {
        clearInterval(awayCheckInterval);
      }
    };
  }, [isTabActive, awayStartTime, isActive, handleFullReset, MAX_AWAY_DURATION_MS]);


  useEffect(() => {
    setDuration(sessionDurationMinutes * 60);
    if (!isActive) { 
      setMotivationalMessage(null);
      setTabSwitchCount(0); // Reset tab switch count if duration changes while inactive
    }
  }, [sessionDurationMinutes, setDuration, isActive]);

  const fetchPrompt = useCallback(async () => {
    if (isFetchingPrompt || !isActive) return; // Also ensure session is active
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
  }, [sessionDurationMinutes, elapsedInSessionSeconds, isFetchingPrompt, toast, isActive]);

  useEffect(() => {
    if (isActive && !isPaused && isTabActive) {
      if (elapsedInSessionSeconds === 0 && (!motivationalMessage || promptError)) { 
        fetchPrompt();
      } else {
        const elapsedMinutes = Math.floor(elapsedInSessionSeconds / 60);
        const lastFetchElapsedMinutes = Math.floor(lastPromptFetchTime / 60);
        if (elapsedMinutes > 0 && elapsedMinutes % PROMPT_FETCH_INTERVAL_MINUTES === 0 && elapsedMinutes > lastFetchElapsedMinutes) {
          fetchPrompt();
        }
      }
    }
  }, [isActive, isPaused, isTabActive, elapsedInSessionSeconds, fetchPrompt, motivationalMessage, lastPromptFetchTime, promptError]);
  
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
      pauseTimer(); // Manual pause
    } else { // Start or Resume
      // If resuming a session that was auto-paused by tab switch, ensure rules weren't broken
      if (isPaused && awayStartTime) {
         // This case should ideally be handled by the auto-resume logic when returning to tab.
         // If user clicks "Resume" manually while away, it's tricky.
         // For now, assume this click happens when back on the tab.
      }
      startTimer();
      if (!isTabActive && isActive) { // Check isActive again after startTimer()
         toast({
            title: "Tab Inactive",
            description: "Timer started, but the tab is not active. Switch back to this tab to see progress.",
            variant: "default",
            duration: 7000,
          });
      }
      // Fetch prompt if starting a new session and on the tab
      if (!motivationalMessage && !promptError && elapsedInSessionSeconds === 0 && isTabActive && !isPaused) {
        fetchPrompt();
      }
    }
  };

  const handleSessionResetButton = () => {
    // Manually reset via button
    handleFullReset("Session manually reset.");
  };

  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
    if (!isActive) {
        resetTimer(newDuration * 60);
        setMotivationalMessage(null);
        setPromptError(null);
        setLastPromptFetchTime(0);
        setTabSwitchCount(0); // Reset counter on duration change if inactive
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
                onReset={handleSessionResetButton} // Changed to custom reset handler
              />
               <div className="text-sm text-center text-muted-foreground -mt-2">
                Tab Switches: {tabSwitchCount} / {MAX_TAB_SWITCHES}
                {awayStartTime && !isTabActive && isActive && (
                <span className="ml-2 text-red-500 font-semibold">(Currently away)</span>
                )}
              </div>
              
              <Separator className="my-4" /> 
              
              <div className="space-y-4">
                <YouTubePlayer key={`youtube-${resetSignal}`} />
                <PdfViewer key={`pdf-${resetSignal}`} />
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
            {isTabActive || !isActive ? "Stay focused, achieve more." : "Warning: Tab lost focus. Return to stay on track!"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
