import { useState, useEffect } from 'react';

export function useScreenVisibility(): boolean {
  const [isTabActive, setIsTabActive] = useState<boolean>(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(document.visibilityState === 'visible');
    };

    // Set initial state
    if (typeof document !== 'undefined') {
       setIsTabActive(document.visibilityState === 'visible');
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isTabActive;
}
