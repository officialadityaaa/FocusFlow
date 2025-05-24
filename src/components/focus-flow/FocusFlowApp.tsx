
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SettingsIcon, XIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTimer } from '@/hooks/useTimer';
import { useScreenVisibility } from '@/hooks/useScreenVisibility';
import { generateMotivationalPrompt, type MotivationalPromptInput } from '@/ai/flows/motivational-prompt';
import { generateFocusChatResponse, type FocusChatInput, type FocusChatOutput } from '@/ai/flows/focus-chat-flow';
import { cn } from '@/lib/utils';


import { TimerDisplay } from './TimerDisplay';
import { ProgressDisplay } from './ProgressDisplay';
import { SessionControls } from './SessionControls';
import { SessionConfiguration } from './SessionConfiguration';
import { MotivationalMessage } from './MotivationalMessage';
import { DistractionModeToggle } from './DistractionModeToggle';
import { ScreenProctorDisplay } from './ScreenProctorDisplay';
import { YouTubePlayer } from './YouTubePlayer';
import { PdfViewer } from './PdfViewer';
import { FocusChatBox } from './FocusChatBox';
import { MusicPlayer } from './MusicPlayer';

const DEFAULT_SESSION_DURATION_MINUTES = 25;
const PROMPT_FETCH_INTERVAL_MINUTES = 5;
const MAX_TAB_SWITCHES = 3;
const MAX_AWAY_DURATION_MS = 2 * 60 * 1000;

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}
interface GenkitChatMessage {
  role: 'user' | 'model';
  parts: {text: string}[];
  isUser?: boolean;
  isModel?: boolean;
}


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
  const [resetSignal, setResetSignal] = useState(0);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatResponding, setIsChatResponding] = useState(false);

  const [isInFullscreen, setIsInFullscreen] = useState(false);
  const [isSessionPrimed, setIsSessionPrimed] = useState(false); // User has clicked "Start" and conditions met
  const cardRef = useRef<HTMLDivElement>(null);


  const handleTimerEnd = useCallback(() => {
    toast({
      title: "Session Complete!",
      description: `You've completed a ${sessionDurationMinutes}-minute focus session. Great job!`,
    });
    setMotivationalMessage("Session Complete! Well done.");
    setIsSessionPrimed(false); // Session is no longer primed
    if (document.fullscreenElement && cardRef.current && document.fullscreenElement === cardRef.current) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
  }, [sessionDurationMinutes, toast]);

  const {
    timeRemainingSeconds,
    isActive: isTimerActuallyActive,
    isPaused: isTimerPaused,
    elapsedInSessionSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    setDuration,
  } = useTimer({
    initialDurationSeconds: sessionDurationMinutes * 60,
    onEnd: handleTimerEnd,
  });

  const handleFullReset = useCallback((reason: string, isViolation: boolean = false) => {
    resetTimer(sessionDurationMinutes * 60);
    setMotivationalMessage(null);
    setPromptError(null);
    setLastPromptFetchTime(0);
    setTabSwitchCount(0);
    setAwayStartTime(null);
    setResetSignal(prev => prev + 1);
    setChatMessages([]);
    setIsSessionPrimed(false); // Ensure session is not primed on reset
    if (document.fullscreenElement && cardRef.current && document.fullscreenElement === cardRef.current) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen on reset:", err));
    }

    toast({
      title: isViolation ? "Session Forfeited!" : "Session Reset",
      description: reason,
      variant: isViolation ? "destructive" : "default",
      duration: 7000,
    });
  }, [resetTimer, sessionDurationMinutes, toast]);

  // Fullscreen state management for the main card
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsInFullscreen(!!(document.fullscreenElement && document.fullscreenElement === cardRef.current));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleAppFullscreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen()
        .catch(err => {
          toast({ title: 'Fullscreen Error', description: `Could not enter fullscreen: ${err.message}`, variant: 'destructive' });
        });
    } else {
       if (document.fullscreenElement === cardRef.current) {
        document.exitFullscreen()
          .catch(err => {
            toast({ title: 'Fullscreen Error', description: `Could not exit fullscreen: ${err.message}`, variant: 'destructive' });
          });
      }
    }
  };

  // Core timer control logic based on session state, fullscreen, and tab activity
  useEffect(() => {
    const shouldTimerRun = isSessionPrimed && isInFullscreen && isTabActive;

    if (shouldTimerRun) {
      if (!isTimerActuallyActive || isTimerPaused) {
        startTimer();
      }
    } else {
      if (isTimerActuallyActive && !isTimerPaused) {
        pauseTimer();
      }
    }
  }, [isSessionPrimed, isInFullscreen, isTabActive, isTimerActuallyActive, isTimerPaused, startTimer, pauseTimer]);


  // Tab switching penalty logic
  useEffect(() => {
    if (!isTabActive && isSessionPrimed) {
      if (awayStartTime === null) {
        const newSwitchCount = tabSwitchCount + 1;
        setTabSwitchCount(newSwitchCount);
        setAwayStartTime(Date.now());

        toast({
          title: "Tab Inactive - Focus Broken!",
          description: `Timer paused. Tab switches used: ${newSwitchCount}/${MAX_TAB_SWITCHES}. Return within ${MAX_AWAY_DURATION_MS / 60000} min.`,
          variant: "destructive",
          duration: 5000,
        });

        if (newSwitchCount > MAX_TAB_SWITCHES) {
          handleFullReset(`Exceeded maximum tab switches (${MAX_TAB_SWITCHES}). Session reset.`, true);
        }
      }
    } else if (isTabActive && isSessionPrimed && awayStartTime) {
      setAwayStartTime(null);
      toast({
        title: "Tab Active",
        description: "Welcome back! Timer will resume if in fullscreen.",
        duration: 3000,
      });
    }
  }, [isTabActive, isSessionPrimed, tabSwitchCount, awayStartTime, handleFullReset, toast]);


  // Check for prolonged absence
  useEffect(() => {
    let awayCheckInterval: NodeJS.Timeout | null = null;
    if (!isTabActive && awayStartTime && isSessionPrimed) {
      awayCheckInterval = setInterval(() => {
        if (awayStartTime && (Date.now() - awayStartTime > MAX_AWAY_DURATION_MS)) {
          handleFullReset(`You were away for more than ${MAX_AWAY_DURATION_MS / 60000} minutes. Session reset.`, true);
          if (awayCheckInterval) clearInterval(awayCheckInterval);
        }
      }, 1000);
    }
    return () => {
      if (awayCheckInterval) clearInterval(awayCheckInterval);
    };
  }, [isTabActive, awayStartTime, isSessionPrimed, handleFullReset]);


  useEffect(() => {
    setDuration(sessionDurationMinutes * 60);
    if (!isSessionPrimed) {
      resetTimer(sessionDurationMinutes * 60);
      setMotivationalMessage(null);
      setChatMessages([]);
    }
  }, [sessionDurationMinutes, setDuration, isSessionPrimed, resetTimer]);

  const fetchPrompt = useCallback(async () => {
    if (isFetchingPrompt || !isSessionPrimed || !isInFullscreen || !isTabActive) return;
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
  }, [sessionDurationMinutes, elapsedInSessionSeconds, isFetchingPrompt, toast, isSessionPrimed, isInFullscreen, isTabActive]);

  useEffect(() => {
    if (isSessionPrimed && isInFullscreen && isTabActive) {
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
  }, [isSessionPrimed, isInFullscreen, isTabActive, elapsedInSessionSeconds, fetchPrompt, motivationalMessage, lastPromptFetchTime, promptError]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (distractionModeEnabled) {
        document.title = "DO NOT DISTURB - FocusFlow";
      } else {
        document.title = "FocusFlow";
      }
    }
  }, [distractionModeEnabled]);

  const handleStartSessionClick = () => {
    if (!isSessionPrimed) {
      setIsSessionPrimed(true); // Mark session as "primed" - ready to start if conditions met
      setTabSwitchCount(0);
      setAwayStartTime(null);
      setChatMessages([]);
      
      // Timer will start via the useEffect hook if conditions (fullscreen, tab active) are met.
      // If not, the hook will keep it paused.
      if (!isInFullscreen) {
        toast({
          title: "Enter Fullscreen",
          description: "Please enter fullscreen mode to start the timer.",
          duration: 4000,
        });
      }
       if (!isTabActive) {
         toast({
            title: "Tab Inactive",
            description: "Session primed, but the tab is not active. Switch back and enter fullscreen.",
            variant: "default",
            duration: 7000,
          });
      }
    }
  };

  const handleSessionResetButton = () => {
    const reason = isTimerActuallyActive || isSessionPrimed
      ? "Session manually reset during an active/primed session."
      : "Session settings reset before start.";
    handleFullReset(reason, false);
  };

  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
    if (!isSessionPrimed) { // Only reset if session isn't primed
        resetTimer(newDuration * 60);
        setMotivationalMessage(null);
        setPromptError(null);
        setLastPromptFetchTime(0);
        setChatMessages([]);
    }
  };

  const toggleSettingsView = () => {
    if (isInFullscreen && !showSettings && cardRef.current && document.fullscreenElement === cardRef.current) {
        document.exitFullscreen().catch(err => console.error("Error exiting fullscreen for settings:", err));
    }
    setShowSettings(!showSettings);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!isSessionPrimed) {
      toast({ title: "Session Not Primed", description: "Please start a focus session to use the chat.", variant: "destructive" });
      return;
    }
    if (!isInFullscreen || !isTabActive) {
      toast({ title: "Chat Paused", description: "Chat is available when the timer is active (fullscreen and tab focused).", variant: "default" });
      return;
    }

    const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: messageText };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsChatResponding(true);

    try {
      const historyForGenkit: GenkitChatMessage[] = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      const input: FocusChatInput = {
        userMessage: messageText,
        history: historyForGenkit,
      };
      const result: FocusChatOutput = await generateFocusChatResponse(input);
      const newBotMessage: ChatMessage = { id: `bot-${Date.now()}`, sender: 'bot', text: result.botResponse };
      setChatMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      const errorBotMessage: ChatMessage = { id: `bot-error-${Date.now()}`, sender: 'bot', text: "Sorry, I couldn't get a response. Please try again." };
      setChatMessages(prev => [...prev, errorBotMessage]);
      toast({
        title: "Chat Error",
        description: "Failed to get a response from the assistant.",
        variant: "destructive",
      });
    } finally {
      setIsChatResponding(false);
    }
  };

  const timerPausedMessage = isSessionPrimed && (!isInFullscreen || !isTabActive)
    ? `Timer paused. ${!isInFullscreen ? 'Enter fullscreen. ' : ''}${!isTabActive ? 'Return to this tab.' : ''}`
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-0 md:p-4 selection:bg-primary/20 selection:text-primary">
      <Card
        ref={cardRef}
        className={cn(
          "w-full max-w-lg rounded-xl shadow-xl shadow-primary/30 bg-card transition-all duration-300 ease-in-out",
          isInFullscreen
            ? "fixed inset-0 z-50 flex h-screen w-screen max-w-none flex-col rounded-none border-none"
            : "overflow-hidden"
        )}
      >
        <CardHeader
          className={cn(
            "bg-card",
            isInFullscreen && "sticky top-0 z-10 flex-shrink-0 border-b backdrop-blur-sm bg-card/90"
          )}
        >
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-semibold text-primary">
              FocusFlow
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleAppFullscreen} aria-label={isInFullscreen ? "Exit app fullscreen" : "Enter app fullscreen"}>
                {isInFullscreen ? <MinimizeIcon className="h-6 w-6" /> : <MaximizeIcon className="h-6 w-6" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleSettingsView} aria-label={showSettings ? "Close settings" : "Open settings"}>
                {showSettings ? <XIcon className="h-6 w-6" /> : <SettingsIcon className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn(
            "space-y-6 p-6 pt-4",
            isInFullscreen && "flex-grow overflow-y-auto"
          )}
        >
          {showSettings ? (
            <SessionConfiguration
              sessionDurationMinutes={sessionDurationMinutes}
              onDurationChange={handleDurationChange}
              disabled={isSessionPrimed}
            />
          ) : (
            <div className="space-y-6">
              <TimerDisplay timeRemainingSeconds={timeRemainingSeconds} />
              {timerPausedMessage && (
                <p className="text-sm text-center text-amber-400 -mt-2">{timerPausedMessage}</p>
              )}
              <ProgressDisplay
                timeRemainingSeconds={timeRemainingSeconds}
                sessionDurationSeconds={sessionDurationMinutes * 60}
              />
              <MotivationalMessage message={motivationalMessage} isLoading={isFetchingPrompt} error={promptError} />

              {(isSessionPrimed) && (
                <FocusChatBox
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isResponding={isChatResponding}
                  disabled={!isTimerActuallyActive} // Disable chat if timer is not actually running
                />
              )}

              <SessionControls
                isSessionPrimed={isSessionPrimed}
                isTimerActive={isTimerActuallyActive}
                onStartSession={handleStartSessionClick}
                onReset={handleSessionResetButton}
              />
               <div className="text-sm text-center text-muted-foreground -mt-2 space-y-1">
                <div>
                  Tab Switches: {tabSwitchCount} / {MAX_TAB_SWITCHES}
                  {awayStartTime && !isTabActive && isSessionPrimed && (
                  <span className="ml-2 text-destructive font-semibold">(Currently away)</span>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <YouTubePlayer key={`youtube-${resetSignal}`} />
                <PdfViewer key={`pdf-${resetSignal}`} />
                <MusicPlayer key={`music-${resetSignal}`} />
              </div>

            </div>
          )}
          <Separator />
          <div className="space-y-4 pt-4">
            <DistractionModeToggle
              isEnabled={distractionModeEnabled}
              onToggle={setDistractionModeEnabled}
            />
            <ScreenProctorDisplay isTabActive={isTabActive} />
          </div>
        </CardContent>
        <CardFooter
          className={cn(
            "bg-card/80 p-4",
            isInFullscreen && "sticky bottom-0 z-10 flex-shrink-0 border-t backdrop-blur-sm bg-card/90"
          )}
        >
          <p className="text-xs text-muted-foreground text-center w-full">
            {isSessionPrimed && !isInFullscreen && !isTabActive ? "Timer paused. Enter fullscreen and return to tab." :
             isSessionPrimed && !isInFullscreen ? "Timer paused. Enter fullscreen to continue." :
             isSessionPrimed && !isTabActive ? "Timer paused. Return to this tab to continue." :
             "Stay focused, achieve more."}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

