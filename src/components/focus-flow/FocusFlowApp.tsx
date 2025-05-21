
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
import { generateFocusChatResponse, type FocusChatInput } from '@/ai/flows/focus-chat-flow';


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


  const handleTimerEnd = useCallback(() => {
    toast({
      title: "Session Complete!",
      description: `You've completed a ${sessionDurationMinutes}-minute focus session. Great job!`,
    });
    setMotivationalMessage("Session Complete! Well done.");
    setTabSwitchCount(0); 
  }, [sessionDurationMinutes, toast]);

  const {
    timeRemainingSeconds,
    isActive,
    isPaused, 
    elapsedInSessionSeconds,
    startTimer,
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

    toast({
      title: isViolation ? "Session Forfeited!" : "Session Reset",
      description: reason,
      variant: isViolation ? "destructive" : "default",
      duration: 7000,
    });
  }, [resetTimer, sessionDurationMinutes, toast]);


  useEffect(() => {
    if (!isTabActive && isActive) { 
      if (awayStartTime === null) { 
        const newSwitchCount = tabSwitchCount + 1;
        setTabSwitchCount(newSwitchCount);
        setAwayStartTime(Date.now());
        // Timer continues to run, no pause.
        toast({
          title: "Tab Inactive - Timer Running!",
          description: `Timer is still running. Tab switches used: ${newSwitchCount}/${MAX_TAB_SWITCHES}. Return within ${MAX_AWAY_DURATION_MS / 60000} min.`,
          variant: "destructive",
          duration: 5000,
        });

        if (newSwitchCount > MAX_TAB_SWITCHES) {
          handleFullReset(`Exceeded maximum tab switches (${MAX_TAB_SWITCHES}). Session reset.`, true);
        }
      }
    } else if (isTabActive && isActive && awayStartTime) { 
      setAwayStartTime(null); 
      toast({
        title: "Tab Active",
        description: "Welcome back! Focus session is ongoing.",
        duration: 3000,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabActive, isActive, tabSwitchCount, awayStartTime, handleFullReset]);


  useEffect(() => {
    let awayCheckInterval: NodeJS.Timeout | null = null;

    if (!isTabActive && awayStartTime && isActive) { 
      awayCheckInterval = setInterval(() => {
        if (awayStartTime && isActive && (Date.now() - awayStartTime > MAX_AWAY_DURATION_MS)) {
          handleFullReset(`You were away for more than ${MAX_AWAY_DURATION_MS / 60000} minutes. Session reset.`, true);
          if (awayCheckInterval) clearInterval(awayCheckInterval); 
        }
      }, 1000); 
    }

    return () => {
      if (awayCheckInterval) {
        clearInterval(awayCheckInterval);
      }
    };
  }, [isTabActive, awayStartTime, isActive, handleFullReset]);


  useEffect(() => {
    setDuration(sessionDurationMinutes * 60);
    if (!isActive) { 
      setMotivationalMessage(null);
      setChatMessages([]);
    }
  }, [sessionDurationMinutes, setDuration, isActive]);

  const fetchPrompt = useCallback(async () => {
    if (isFetchingPrompt || !isActive) return; 
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
    if (isActive && isTabActive) { 
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
  }, [isActive, isTabActive, elapsedInSessionSeconds, fetchPrompt, motivationalMessage, lastPromptFetchTime, promptError]);
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (distractionModeEnabled) {
        document.title = "DO NOT DISTURB - FocusFlow";
      } else {
        document.title = "FocusFlow";
      }
    }
  }, [distractionModeEnabled]);

  const handleStartSession = () => {
    if (!isActive) { 
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
      setChatMessages([]); 
    }
  };

  const handleSessionResetButton = () => {
    // This button should be disabled by `isActive` prop in SessionControls.
    // This check is an additional safeguard.
    if (!isActive) {
      handleFullReset("Session manually reset before start.", false);
    }
    // If isActive is true, do nothing, as the button should be disabled.
  };

  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
    if (!isActive) {
        resetTimer(newDuration * 60);
        setMotivationalMessage(null);
        setPromptError(null);
        setLastPromptFetchTime(0);
        setChatMessages([]);
    }
  };
  
  const toggleSettings = () => setShowSettings(!showSettings);

  const handleSendMessage = async (messageText: string) => {
    if (!isActive) {
      toast({ title: "Session Not Active", description: "Please start a focus session to use the chat.", variant: "destructive" });
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
      const result = await generateFocusChatResponse(input);
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
              
              {isActive && ( // Show chatbox only when session is active
                <FocusChatBox
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isResponding={isChatResponding}
                  disabled={!isActive} // Disable chat if session not active
                />
              )}

              <SessionControls
                isActive={isActive}
                isPaused={isPaused} 
                onStartPause={handleStartSession} 
                onReset={handleSessionResetButton}
              />
               <div className="text-sm text-center text-muted-foreground -mt-2 space-y-1">
                <div>
                  Tab Switches: {tabSwitchCount} / {MAX_TAB_SWITCHES}
                  {awayStartTime && !isTabActive && isActive && (
                  <span className="ml-2 text-red-500 font-semibold">(Currently away, timer running)</span>
                  )}
                </div>
              </div>
              
              <Separator className="my-4" /> 
              
              <div className="space-y-4">
                <YouTubePlayer key={`youtube-${resetSignal}`} />
                <PdfViewer key={`pdf-${resetSignal}`} />
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
        <CardFooter className="bg-secondary/50 p-4">
          <p className="text-xs text-muted-foreground text-center w-full">
            {isTabActive || !isActive ? "Stay focused, achieve more." : "Warning: Tab lost focus. Timer still running. Return to stay on track!"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

