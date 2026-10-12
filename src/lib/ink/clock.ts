import { useEffect, useRef, useState } from "react";

export function useCountdown(running: boolean, endsAt: number, onDone: () => void): number {
  const [left, setLeft] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let fired = false;
    const tick = () => {
      const ms = Math.max(0, endsAt - performance.now());
      setLeft(ms);
      if (ms <= 0) {
        if (!fired) {
          fired = true;
          done.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, endsAt]);
  return left;
}

export function formatLeft(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
