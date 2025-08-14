// client/src/hooks/useCountdown.ts
import { useEffect, useRef, useState } from "react";

export function useCountdown(seconds: number, autoStart = false) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(timerRef.current!);
          timerRef.current = null;
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running]);

  const start = () => {
    setRemaining(seconds);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
  };
  const reset = () => {
    setRemaining(seconds);
    setRunning(false);
  };

  return { remaining, running, start, stop, reset, setRemaining, setRunning };
}
