import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerProps {
  initialDurationSeconds: number;
  onTick?: (timeRemaining: number) => void;
  onEnd?: () => void;
}

interface UseTimerReturn {
  timeRemainingSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  elapsedInSessionSeconds: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: (newDurationSeconds?: number) => void;
  setDuration: (newDurationSeconds: number) => void;
}

export function useTimer({
  initialDurationSeconds,
  onTick,
  onEnd,
}: UseTimerProps): UseTimerReturn {
  const [durationSeconds, setDurationSeconds] = useState(initialDurationSeconds);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(initialDurationSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedInSessionSeconds, setElapsedInSessionSeconds] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTickRef = useRef(onTick);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onTickRef.current = onTick;
    onEndRef.current = onEnd;
  }, [onTick, onEnd]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemainingSeconds((prevTime) => {
          const newTime = prevTime - 1;
          if (onTickRef.current) {
            onTickRef.current(newTime);
          }
          if (newTime <= 0) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            if (onEndRef.current) {
              onEndRef.current();
            }
            setElapsedInSessionSeconds(durationSeconds); // Mark full duration as elapsed
            return 0;
          }
          setElapsedInSessionSeconds((prevElapsed) => prevElapsed + 1);
          return newTime;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, durationSeconds]);

  const startTimer = useCallback(() => {
    if (timeRemainingSeconds <= 0) { // If starting from a completed session, reset to full duration
       setTimeRemainingSeconds(durationSeconds);
       setElapsedInSessionSeconds(0);
    }
    setIsActive(true);
    setIsPaused(false);
  }, [timeRemainingSeconds, durationSeconds]);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resetTimer = useCallback((newDuration?: number) => {
    setIsActive(false);
    setIsPaused(false);
    const resetDuration = newDuration ?? durationSeconds;
    if(newDuration !== undefined) setDurationSeconds(newDuration);
    setTimeRemainingSeconds(resetDuration);
    setElapsedInSessionSeconds(0);
  }, [durationSeconds]);
  
  const setTimerDuration = useCallback((newDurationSeconds: number) => {
    setDurationSeconds(newDurationSeconds);
    if (!isActive) { // Only update timeRemaining if timer is not active
      setTimeRemainingSeconds(newDurationSeconds);
      setElapsedInSessionSeconds(0);
    }
  }, [isActive]);


  return {
    timeRemainingSeconds,
    isActive,
    isPaused,
    elapsedInSessionSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    setDuration: setTimerDuration,
  };
}
